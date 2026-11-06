import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';
import { posts } from './feedback';

export const changelogs = pgTable('changelogs', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: text('content').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const changelogPosts = pgTable(
  'changelog_posts',
  {
    changelogId: text('changelog_id')
      .notNull()
      .references(() => changelogs.id, { onDelete: 'cascade' }),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.changelogId, table.postId] }),
  ]
);

