import { Hono } from "hono"
import {
  requireApiKey,
  registerApiKeyForWorkspace,
  clearApiKeysStore,
} from "../../middleware/api-key-auth"
import { McpService } from "./mcp.service"
import {
  listFeedbackMcpSchema,
  getFeedbackDetailsMcpSchema,
  createFeedbackMcpSchema,
  updatePostStatusMcpSchema,
  getRoadmapKanbanMcpSchema,
  createChangelogReleaseMcpSchema,
} from "@katauser/shared"

export { registerApiKeyForWorkspace, clearApiKeysStore }

export const mcpToolsMetadata = [
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
          description: "Metode sorting",
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

export const mcpRoute = new Hono<{
  Variables: {
    workspaceId: string
    apiKeyId: string
    apiKeyPermissions: string[]
  }
}>()
  .use("*", requireApiKey)
  .get("/tools", (c) => {
    return c.json({
      tools: mcpToolsMetadata,
    })
  })
  .post("/tools/:toolName", async (c) => {
    const toolName = c.req.param("toolName")
    const workspaceId = c.get("workspaceId") as string
    const service = new McpService(workspaceId)
    const body = await c.req.json().catch(() => ({}))
    const args = body.arguments ?? body

    switch (toolName) {
      case "list_feedback": {
        const parsed = listFeedbackMcpSchema.safeParse(args)
        if (!parsed.success) {
          return c.json({ success: false, errors: parsed.error.errors }, 400)
        }
        const result = await service.listFeedback(parsed.data)
        return c.json(result)
      }
      case "get_feedback_details": {
        const parsed = getFeedbackDetailsMcpSchema.safeParse(args)
        if (!parsed.success) {
          return c.json({ success: false, errors: parsed.error.errors }, 400)
        }
        const result = await service.getFeedbackDetails(parsed.data)
        if (!result.success) {
          return c.json(result, 404)
        }
        return c.json(result)
      }
      case "create_feedback": {
        const parsed = createFeedbackMcpSchema.safeParse(args)
        if (!parsed.success) {
          return c.json({ success: false, errors: parsed.error.errors }, 400)
        }
        const result = await service.createFeedback(parsed.data)
        return c.json(result)
      }
      case "update_post_status": {
        const parsed = updatePostStatusMcpSchema.safeParse(args)
        if (!parsed.success) {
          return c.json({ success: false, errors: parsed.error.errors }, 400)
        }
        const result = await service.updatePostStatus(parsed.data)
        if (!result.success) {
          return c.json(result, 404)
        }
        return c.json(result)
      }
      case "get_roadmap_kanban": {
        const parsed = getRoadmapKanbanMcpSchema.safeParse(args)
        if (!parsed.success) {
          return c.json({ success: false, errors: parsed.error.errors }, 400)
        }
        const result = await service.getRoadmapKanban()
        return c.json(result)
      }
      case "create_changelog_release": {
        const parsed = createChangelogReleaseMcpSchema.safeParse(args)
        if (!parsed.success) {
          return c.json({ success: false, errors: parsed.error.errors }, 400)
        }
        const result = await service.createChangelogRelease(parsed.data)
        return c.json(result)
      }
      default:
        return c.json(
          {
            success: false,
            message: `Tool '${toolName}' not found`,
          },
          404,
        )
    }
  })
