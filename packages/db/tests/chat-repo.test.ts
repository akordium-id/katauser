import { describe, it, expect, vi } from 'vitest';
import { ChatRepository } from '../src/repositories/chat';

describe('ChatRepository Unit Tests', () => {
  it('creates a new conversation', async () => {
    const mockDb: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'conv_1',
              workspaceId: 'ws_1',
              endUserId: 'usr_1',
              status: 'open',
              assignedTo: 'ai_juno',
            },
          ]),
        }),
      }),
    };

    const repo = new ChatRepository(mockDb);
    const conv = await repo.createConversation({
      workspaceId: 'ws_1',
      endUserId: 'usr_1',
    });

    expect(conv.id).toBe('conv_1');
    expect(conv.assignedTo).toBe('ai_juno');
  });

  it('saves a message to a conversation', async () => {
    const mockDb: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'msg_1',
              conversationId: 'conv_1',
              senderType: 'end_user',
              senderId: 'usr_1',
              content: 'Halo Juno',
            },
          ]),
        }),
      }),
    };

    const repo = new ChatRepository(mockDb);
    const msg = await repo.sendMessage({
      conversationId: 'conv_1',
      senderType: 'end_user',
      senderId: 'usr_1',
      content: 'Halo Juno',
    });

    expect(msg.id).toBe('msg_1');
    expect(msg.content).toBe('Halo Juno');
  });

  it('escalates a conversation to human agent', async () => {
    const mockDb: any = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'conv_1',
                assignedTo: 'human',
                status: 'open',
              },
            ]),
          }),
        }),
      }),
    };

    const repo = new ChatRepository(mockDb);
    const updated = await repo.escalateToHuman('conv_1');

    expect(updated.assignedTo).toBe('human');
  });
});
