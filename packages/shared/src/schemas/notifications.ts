import { z } from 'zod';

export const voterNotificationStatusSchema = z.enum(['planned', 'in_progress', 'shipped']);
export type VoterNotificationStatus = z.infer<typeof voterNotificationStatusSchema>;

export const voterNotificationPayloadSchema = z.object({
  recipientEmail: z.string().email('Format recipientEmail tidak valid'),
  recipientName: z.string().optional(),
  workspaceName: z.string().min(1, 'Workspace name wajib diisi'),
  postTitle: z.string().min(1, 'Post title wajib diisi'),
  newStatus: voterNotificationStatusSchema,
  postUrl: z.string().url('Post URL tidak valid'),
  changelogUrl: z.string().url().optional(),
});

export type VoterNotificationPayload = z.infer<typeof voterNotificationPayloadSchema>;
