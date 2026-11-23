import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { workspaces } from "./workspaces"

export const workspaceApiKeys = pgTable(
  "workspace_api_keys",
  {
    id: text("id").primaryKey(), // prefix 'key_'
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    permissions: jsonb("permissions").default(["read", "write"]).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("api_key_hash_unique").on(table.keyHash),
    index("api_key_workspace_idx").on(table.workspaceId),
  ],
)
