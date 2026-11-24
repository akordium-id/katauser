import { z } from "zod"

export const listFeedbackMcpSchema = z.object({
  status: z
    .enum(["all", "open", "planned", "in_progress", "completed", "closed"])
    .optional()
    .default("all"),
  boardSlug: z.string().optional(),
  sortBy: z.enum(["popular", "recent", "mrr"]).optional().default("popular"),
  limit: z.number().min(1).max(50).optional().default(10),
})

export type ListFeedbackMcpInput = z.infer<typeof listFeedbackMcpSchema>

export const getFeedbackDetailsMcpSchema = z.object({
  postId: z.string().min(1).describe("ID post feedback (format 'post_...')"),
})

export type GetFeedbackDetailsMcpInput = z.infer<
  typeof getFeedbackDetailsMcpSchema
>

export const createFeedbackMcpSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(5),
  boardSlug: z
    .string()
    .optional()
    .describe("Slug board tujuan, default ke board pertama"),
  customerEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .describe("Email customer jika diinput atas nama customer"),
  customerName: z.string().optional(),
  customerCompany: z.string().optional(),
  customerMrr: z.number().min(0).optional(),
})

export type CreateFeedbackMcpInput = z.infer<typeof createFeedbackMcpSchema>

export const updatePostStatusMcpSchema = z.object({
  postId: z.string().min(1),
  status: z.enum(["open", "planned", "in_progress", "completed", "closed"]),
  notifyVoters: z
    .boolean()
    .optional()
    .default(true)
    .describe("Kirim notifikasi email ke voters jika status completed"),
})

export type UpdatePostStatusMcpInput = z.infer<typeof updatePostStatusMcpSchema>

export const getRoadmapKanbanMcpSchema = z.object({})

export type GetRoadmapKanbanMcpInput = z.infer<typeof getRoadmapKanbanMcpSchema>

export const createChangelogReleaseMcpSchema = z.object({
  version: z.string().min(1).describe("Nomor versi rilis, misal 'v1.4.0'"),
  title: z.string().min(3),
  content: z
    .string()
    .min(5)
    .describe("Isi catatan rilis dalam format Markdown"),
  postIds: z
    .array(z.string())
    .optional()
    .describe("Daftar post ID yang dirilis pada versi ini"),
  publishedAt: z
    .string()
    .optional()
    .describe("Tanggal rilis ISO format atau YYYY-MM-DD"),
})

export type CreateChangelogReleaseMcpInput = z.infer<
  typeof createChangelogReleaseMcpSchema
>
