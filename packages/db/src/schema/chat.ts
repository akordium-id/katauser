import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  endUserId: text('end_user_id'),
  status: text('status').notNull().default('open'), // 'open' | 'pending' | 'closed'
  assignedTo: text('assigned_to').notNull().default('ai_juno'), // 'ai_juno' | 'human'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderType: text('sender_type').notNull(), // 'end_user' | 'agent' | 'ai'
  senderId: text('sender_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

