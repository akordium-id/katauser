import { z } from "zod"

export const createChangelogSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(128),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens",
    ),
  content: z
    .string()
    .min(5, "Content must be at least 5 characters")
    .max(20000),
  publishedAt: z.string().datetime().optional(),
  postIds: z.array(z.string()).optional(),
})

export const updateChangelogSchema = createChangelogSchema.partial()

export type CreateChangelogInput = z.infer<typeof createChangelogSchema>
export type UpdateChangelogInput = z.infer<typeof updateChangelogSchema>
