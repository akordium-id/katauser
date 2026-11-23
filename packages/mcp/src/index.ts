import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js"

export interface McpConfig {
  apiUrl: string
  apiKey: string
}

export const KATAUSER_TOOLS: Tool[] = [
  {
    name: "list_feedback",
    description:
      "Mengambil daftar post masukan pengguna di workspace Katauser dengan filter status, board, dan sorting berdasarkan popularitas atau MRR.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["all", "open", "planned", "in_progress", "completed", "closed"],
          default: "all",
          description: "Status filter masukan",
        },
        boardSlug: {
          type: "string",
          description: "Slug board tertentu (opsional)",
        },
        sortBy: {
          type: "string",
          enum: ["popular", "recent", "mrr"],
          default: "popular",
          description: "Metode sorting: popular (votes), recent (tanggal), mrr (nilai pendapatan)",
        },
        limit: {
          type: "number",
          default: 10,
          description: "Batas jumlah post yang diambil (1-50)",
        },
      },
    },
  },
  {
    name: "get_feedback_details",
    description:
      "Membaca detail lengkap satu post feedback termasuk komentar, daftar voter, dan tiket Linear yang tertaut.",
    inputSchema: {
      type: "object",
      properties: {
        postId: {
          type: "string",
          description: "ID feedback post (format 'post_...' atau 'p_...')",
        },
      },
      required: ["postId"],
    },
  },
  {
    name: "create_feedback",
    description:
      "Membuat postingan feedback baru di board Katauser (dapat diatasnamakan customer beserta estimasi MRR).",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Judul ide masukan" },
        content: { type: "string", description: "Deskripsi lengkap masukan" },
        boardSlug: {
          type: "string",
          description: "Slug board tujuan (opsional)",
        },
        customerEmail: {
          type: "string",
          description: "Email pelanggan jika diinput atas nama customer",
        },
        customerName: { type: "string", description: "Nama pelanggan" },
        customerCompany: { type: "string", description: "Perusahaan pelanggan" },
        customerMrr: {
          type: "number",
          description: "Estimasi MRR pelanggan (USD/IDR)",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "update_post_status",
    description:
      "Memperbarui status implementasi post feedback (planned, in_progress, completed, closed) dan otomatis memberi tahu voters jika selesai.",
    inputSchema: {
      type: "object",
      properties: {
        postId: { type: "string", description: "ID post yang akan diupdate" },
        status: {
          type: "string",
          enum: ["planned", "in_progress", "completed", "closed"],
          description: "Status baru",
        },
        notifyVoters: {
          type: "boolean",
          default: true,
          description: "Kirim email notifikasi ke voters jika status completed",
        },
      },
      required: ["postId", "status"],
    },
  },
  {
    name: "get_roadmap_kanban",
    description:
      "Mengambil ringkasan roadmap 3 kolom (Planned, In Progress, Completed).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_changelog_release",
    description:
      "Mempublikasikan catatan rilis changelog baru di Katauser beserta tautan ke post feedback yang diselesaikan.",
    inputSchema: {
      type: "object",
      properties: {
        version: { type: "string", description: "Nomor versi, misal 'v1.4.0'" },
        title: { type: "string", description: "Judul rilis changelog" },
        content: {
          type: "string",
          description: "Konten rilis dalam format Markdown",
        },
        postIds: {
          type: "array",
          items: { type: "string" },
          description: "Daftar ID post yang diselesaikan dalam rilis ini",
        },
        publishedAt: {
          type: "string",
          description: "Tanggal publikasi ISO 8601 (opsional)",
        },
      },
      required: ["version", "title", "content"],
    },
  },
]

export function createMcpServerInstance(config: McpConfig) {
  const cleanApiUrl = config.apiUrl.replace(/\/+$/, "")

  const server = new Server(
    {
      name: "katauser-mcp",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  const executeTool = async (
    name: string,
    args: Record<string, unknown> = {},
  ) => {
    try {
      const endpoint = `${cleanApiUrl}/api/v1/mcp/tools/${name}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: data.message || `Error calling tool ${name}: HTTP ${response.status}`,
            },
          ],
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Network error connecting to Katauser at ${cleanApiUrl}: ${err.message}`,
          },
        ],
      }
    }
  }

  // Register tools list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: KATAUSER_TOOLS,
    }
  })

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    return executeTool(name, args || {})
  })

  return {
    server,
    tools: KATAUSER_TOOLS,
    executeTool,
  }
}

export async function runStdioServer() {
  const apiKey = process.env.KATAUSER_API_KEY
  const apiUrl = process.env.KATAUSER_API_URL || "http://localhost:3000"

  if (!apiKey) {
    console.error("Error: KATAUSER_API_KEY environment variable is required.")
    process.exit(1)
  }

  const { server } = createMcpServerInstance({ apiUrl, apiKey })
  const transport = new StdioServerTransport()

  await server.connect(transport)
  console.error(`Katauser MCP Server running via STDIO (Target: ${apiUrl})`)
}
