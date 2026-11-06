import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(64),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(128),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.string(),
})

export type UserProfile = z.infer<typeof userProfileSchema>
