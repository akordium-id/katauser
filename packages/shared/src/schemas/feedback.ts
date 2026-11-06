import { z } from "zod"

export const POST_STATUSES = [
  "pending",
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "shipped",
  "closed",
] as const

export type PostStatus = (typeof POST_STATUSES)[number]

export const createBoardSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(48)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens",
    ),
  description: z.string().max(256).optional(),
  isPrivate: z.boolean().default(false),
  allowGuestPosts: z.boolean().default(true),
})

export const updateBoardSchema = createBoardSchema.partial()

export const createPostSchema = z.object({
  boardId: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(128),
  content: z.string().min(5, "Content must be at least 5 characters").max(5000),
})

export const updatePostStatusSchema = z.object({
  status: z.enum(POST_STATUSES),
})

export const votePostSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
})

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  isInternal: z.boolean().default(false),
})

export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostStatusInput = z.infer<typeof updatePostStatusSchema>
export type VotePostInput = z.infer<typeof votePostSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
