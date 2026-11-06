export type RoadmapColumnKey = "planned" | "inProgress" | "completed"

export interface ColumnMeta {
  title: string
  color: string
  badgeClass: string
}

export interface RoadmapData {
  planned: any[]
  inProgress: any[]
  completed: any[]
}

export function getColumnMeta(column: RoadmapColumnKey): ColumnMeta {
  switch (column) {
    case "planned":
      return {
        title: "Planned",
        color: "blue",
        badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      }
    case "inProgress":
      return {
        title: "In Progress",
        color: "amber",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      }
    case "completed":
      return {
        title: "Completed",
        color: "emerald",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      }
    default:
      return {
        title: "Unknown",
        color: "gray",
        badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      }
  }
}

export function countTotalRoadmapItems(roadmap: RoadmapData): number {
  if (!roadmap) return 0
  const plannedCount = Array.isArray(roadmap.planned)
    ? roadmap.planned.length
    : 0
  const inProgressCount = Array.isArray(roadmap.inProgress)
    ? roadmap.inProgress.length
    : 0
  const completedCount = Array.isArray(roadmap.completed)
    ? roadmap.completed.length
    : 0
  return plannedCount + inProgressCount + completedCount
}
