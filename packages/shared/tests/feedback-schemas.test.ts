import { describe, it, expect } from 'vitest';
import {
  createBoardSchema,
  createPostSchema,
  updatePostStatusSchema,
  createCommentSchema,
  POST_STATUSES,
} from '../src/schemas/feedback';

describe('Feedback Schemas Validation', () => {
  describe('createBoardSchema', () => {
    it('validates a correct board payload', () => {
      const valid = {
        name: 'Feature Requests',
        slug: 'feature-requests',
        description: 'Suggest improvements for our product',
        isPrivate: false,
        allowGuestPosts: true,
      };
      const parsed = createBoardSchema.parse(valid);
      expect(parsed.name).toBe('Feature Requests');
      expect(parsed.slug).toBe('feature-requests');
      expect(parsed.isPrivate).toBe(false);
    });

    it('rejects empty board name', () => {
      expect(() => createBoardSchema.parse({ name: '', slug: 'features' })).toThrow();
    });
  });

  describe('createPostSchema', () => {
    it('validates a correct post payload', () => {
      const valid = {
        title: 'Dark Mode Support',
        content: 'Please add a dark theme option in settings.',
        boardId: 'board_123',
      };
      const parsed = createPostSchema.parse(valid);
      expect(parsed.title).toBe('Dark Mode Support');
      expect(parsed.boardId).toBe('board_123');
    });

    it('rejects titles that are too short', () => {
      expect(() => createPostSchema.parse({ title: 'Hi', content: '...', boardId: '123' })).toThrow();
    });
  });

  describe('updatePostStatusSchema', () => {
    it('accepts only allowed statuses', () => {
      for (const status of POST_STATUSES) {
        expect(updatePostStatusSchema.parse({ status }).status).toBe(status);
      }
    });

    it('rejects invalid status', () => {
      expect(() => updatePostStatusSchema.parse({ status: 'invalid_status' })).toThrow();
    });
  });

  describe('createCommentSchema', () => {
    it('validates a comment payload', () => {
      const valid = {
        content: 'I agree, this would be very useful!',
        isInternal: false,
      };
      const parsed = createCommentSchema.parse(valid);
      expect(parsed.content).toBe('I agree, this would be very useful!');
    });
  });
});

