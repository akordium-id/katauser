import { describe, it, expect } from 'vitest';
import {
  createConversationSchema,
  sendMessageSchema,
  escalateConversationSchema,
} from '../src/schemas/chat';

describe('Chat & Conversation Zod Schemas', () => {
  it('validates conversation creation payload', () => {
    const valid = {
      workspaceId: 'acme-corp',
      endUserId: 'usr_123',
      initialMessage: 'Halo, saya punya pertanyaan soal billing',
    };
    const parsed = createConversationSchema.parse(valid);
    expect(parsed.workspaceId).toBe('acme-corp');
    expect(parsed.endUserId).toBe('usr_123');
    expect(parsed.initialMessage).toBe('Halo, saya punya pertanyaan soal billing');
  });

  it('validates message sending payload and rejects empty content', () => {
    const validMessage = {
      conversationId: 'conv_456',
      senderType: 'end_user',
      senderId: 'usr_123',
      content: 'Bagaimana cara setup custom domain?',
    };
    const parsed = sendMessageSchema.parse(validMessage);
    expect(parsed.senderType).toBe('end_user');
    expect(parsed.content).toBe('Bagaimana cara setup custom domain?');

    // Reject empty content
    expect(() =>
      sendMessageSchema.parse({
        conversationId: 'conv_456',
        senderType: 'end_user',
        senderId: 'usr_123',
        content: '   ',
      })
    ).toThrow();
  });

  it('validates conversation escalation payload', () => {
    const validEscalation = {
      conversationId: 'conv_456',
      reason: 'User meminta berbicara dengan staf manusia',
    };
    const parsed = escalateConversationSchema.parse(validEscalation);
    expect(parsed.conversationId).toBe('conv_456');
    expect(parsed.reason).toContain('staf manusia');
  });
});
