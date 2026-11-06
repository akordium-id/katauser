import { pgTable, text, timestamp, customType } from "drizzle-orm/pg-core"
import { workspaces } from "./workspaces"

// Custom pgvector type for Drizzle
export const vector = customType<{
  data: number[]
  driverData: string
  config: { dimensions: number }
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value)
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value)
  },
})

export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // 'doc' | 'post' | 'changelog' | 'faq'
  sourceId: text("source_id").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
