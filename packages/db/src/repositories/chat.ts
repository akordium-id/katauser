import { eq, desc, asc, and } from 'drizzle-orm';
import { conversations, messages } from '../schema/chat';

export class ChatRepository {
  constructor(private db: any) {}

  async createConversation(params: {
    workspaceId: string;
    endUserId?: string;
  }) {
    const id = 'conv_' + Math.random().toString(36).substring(2, 10);
    const [conv] = await this.db
      .insert(conversations)
      .values({
        id,
        workspaceId: params.workspaceId,
        endUserId: params.endUserId || null,
        status: 'open',
        assignedTo: 'ai_juno',
      })
      .returning();

    return conv;
  }

  async sendMessage(params: {
    conversationId: string;
    senderType: 'end_user' | 'agent' | 'ai';
    senderId: string;
    content: string;
  }) {
    const id = 'msg_' + Math.random().toString(36).substring(2, 10);
    const [msg] = await this.db
      .insert(messages)
      .values({
        id,
        conversationId: params.conversationId,
        senderType: params.senderType,
        senderId: params.senderId,
        content: params.content,
      })
      .returning();

    return msg;
  }

  async getConversation(conversationId: string) {
    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    return conv || null;
  }

  async getMessages(conversationId: string) {
    return this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  async escalateToHuman(conversationId: string, _reason?: string) {
    const [updated] = await this.db
      .update(conversations)
      .set({
        assignedTo: 'human',
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    return updated;
  }

  async listWorkspaceConversations(
    workspaceId: string,
    filter?: { status?: string; assignedTo?: string }
  ) {
    const conditions = [eq(conversations.workspaceId, workspaceId)];

    if (filter?.status) {
      conditions.push(eq(conversations.status, filter.status));
    }
    if (filter?.assignedTo) {
      conditions.push(eq(conversations.assignedTo, filter.assignedTo));
    }

    return this.db
      .select()
      .from(conversations)
      .where(and(...conditions))
      .orderBy(desc(conversations.createdAt));
  }
}
