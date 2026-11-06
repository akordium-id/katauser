export interface StatusBadge {
  label: string
  color: string
}

export interface ConversationItem {
  id: string
  workspaceId: string
  endUserId?: string
  status: "open" | "pending" | "closed" | string
  assignedTo: "ai_juno" | "human" | string
  createdAt: string
  lastMessage?: string
}

export function getConversationStatusBadge(
  status: string,
  assignedTo: string,
): StatusBadge {
  if (status === "closed") {
    return {
      label: "Selesai",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    }
  }

  if (assignedTo === "human") {
    return {
      label: "Perlu Staf",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    }
  }

  return {
    label: "AI Juno",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  }
}

export function filterConversations<T extends { assignedTo?: string }>(
  conversations: T[],
  filter: "all" | "human" | "ai",
): T[] {
  if (!Array.isArray(conversations)) return []
  if (filter === "human") {
    return conversations.filter((c) => c.assignedTo === "human")
  }
  if (filter === "ai") {
    return conversations.filter((c) => c.assignedTo === "ai_juno")
  }
  return conversations
}
