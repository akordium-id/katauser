import { z } from "zod"

export const ingestDocumentSchema = z.object({
  title: z.string().min(2, "Judul dokumen minimal 2 karakter").max(200),
  content: z.string().min(10, "Konten dokumen minimal 10 karakter"),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceType: z.enum(["doc", "faq", "website", "post"]).default("doc"),
})

export type IngestDocumentInput = z.infer<typeof ingestDocumentSchema>

export const similarityQuerySchema = z.object({
  query: z.string().min(2, "Query pencarian minimal 2 karakter"),
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().min(1).max(20).default(3),
})

export type SimilarityQueryInput = z.infer<typeof similarityQuerySchema>

export const similarPostsQuerySchema = z.object({
  title: z.string().min(2, "Judul post minimal 2 karakter"),
  content: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().min(1).max(10).default(3),
})

export type SimilarPostsQueryInput = z.infer<typeof similarPostsQuerySchema>
