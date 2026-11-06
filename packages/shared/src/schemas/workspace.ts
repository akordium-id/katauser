import { z } from "zod"

export const RESERVED_SLUGS = [
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "dashboard",
  "docs",
  "login",
  "mail",
  "register",
  "root",
  "settings",
  "status",
  "support",
  "widget",
  "www",
] as const

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(48)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens",
    )
    .refine((slug) => !RESERVED_SLUGS.includes(slug as any), {
      message: "This slug is reserved and cannot be used",
    }),
  customDomain: z
    .string()
    .regex(
      /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}$/i,
      "Invalid domain format",
    )
    .optional(),
})

export const updateWorkspaceSchema = createWorkspaceSchema.partial()

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
