import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { workspaces, workspaceMembers, users, boards, posts, knowledgeEmbeddings } from '../src/schema';

describe('Database Schema Definitions', () => {
  it('defines workspaces table with correct columns', () => {
    const columns = getTableColumns(workspaces);
    expect(columns.id).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.slug).toBeDefined();
    expect(columns.customDomain).toBeDefined();
    expect(columns.jwtSecret).toBeDefined();
    expect(columns.plan).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });

  it('defines workspaceMembers table with workspace_id foreign key', () => {
    const columns = getTableColumns(workspaceMembers);
    expect(columns.id).toBeDefined();
    expect(columns.workspaceId).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.role).toBeDefined();
  });

  it('defines boards table scoped to workspace', () => {
    const columns = getTableColumns(boards);
    expect(columns.id).toBeDefined();
    expect(columns.workspaceId).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.slug).toBeDefined();
  });

  it('defines posts table with status and counters', () => {
    const columns = getTableColumns(posts);
    expect(columns.id).toBeDefined();
    expect(columns.workspaceId).toBeDefined();
    expect(columns.boardId).toBeDefined();
    expect(columns.title).toBeDefined();
    expect(columns.content).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.votesCount).toBeDefined();
  });

  it('defines knowledgeEmbeddings table with vector column for Juno RAG', () => {
    const columns = getTableColumns(knowledgeEmbeddings);
    expect(columns.id).toBeDefined();
    expect(columns.workspaceId).toBeDefined();
    expect(columns.content).toBeDefined();
    expect(columns.embedding).toBeDefined();
  });
});

