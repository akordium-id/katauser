import { createHash } from "node:crypto"

/**
 * Split long text into manageable overlapping chunks for RAG embedding
 */
export function chunkText(
  text: string,
  maxChars = 500,
  overlap = 50,
): string[] {
  const clean = text.trim()
  if (clean.length <= maxChars) {
    return [clean]
  }

  const chunks: string[] = []
  let startIndex = 0

  while (startIndex < clean.length) {
    let endIndex = startIndex + maxChars

    // Break cleanly on paragraph or sentence boundary if possible
    if (endIndex < clean.length) {
      const nextNewline = clean.lastIndexOf("\n", endIndex)
      const nextPeriod = clean.lastIndexOf(". ", endIndex)
      const bestBreak = Math.max(nextNewline, nextPeriod)

      if (bestBreak > startIndex + maxChars * 0.5) {
        endIndex = bestBreak + (clean[bestBreak] === "." ? 2 : 1)
      }
    } else {
      endIndex = clean.length
    }

    const chunk = clean.slice(startIndex, endIndex).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    if (endIndex >= clean.length) break
    startIndex = Math.max(startIndex + 1, endIndex - overlap)
  }

  return chunks
}

/**
 * Compute cosine similarity between two numeric vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Generate a deterministic normalized 1536-dimensional vector for offline tests / local dev
 */
export function generateDeterministicVector(
  text: string,
  dimensions = 1536,
): number[] {
  const vec = new Array(dimensions).fill(0)
  // Clean text and extract tokens
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")
  const words = clean.split(/\s+/).filter((w) => w.length > 1)

  // Bag-of-words and trigrams
  for (const word of words) {
    const wordHash = createHash("md5").update(word).digest()
    for (let i = 0; i < 8; i++) {
      const idx = (wordHash[i] * 53 + i * 17) % dimensions
      vec[idx] += 2.0
    }

    // Trigrams for partial/stemming matches
    for (let i = 0; i < word.length - 2; i++) {
      const tri = word.substring(i, i + 3)
      const triHash = createHash("md5").update(tri).digest()
      const idx = (triHash[0] * 31 + triHash[1]) % dimensions
      vec[idx] += 1.0
    }
  }

  // Normalize to unit length (|v| = 1)
  let norm = 0
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i]
  }
  norm = Math.sqrt(norm) || 1

  for (let i = 0; i < dimensions; i++) {
    vec[i] = vec[i] / norm
  }

  return vec
}

/**
 * Generate vector embeddings via OpenAI API or deterministic mock fallback
 */
export async function generateEmbedding(
  text: string,
  apiKey?: string,
): Promise<number[]> {
  const effectiveKey = apiKey || process.env.OPENAI_API_KEY

  if (!effectiveKey) {
    return generateDeterministicVector(text)
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${effectiveKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small",
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return generateDeterministicVector(text)
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
    return data.data[0].embedding
  } catch {
    return generateDeterministicVector(text)
  }
}
