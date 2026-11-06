export function formatPostStatus(status: string): string {
  switch (status) {
    case 'under_review':
      return 'Under Review';
    case 'in_progress':
      return 'In Progress';
    case 'planned':
      return 'Planned';
    case 'completed':
      return 'Completed';
    case 'closed':
      return 'Closed';
    case 'pending':
    default:
      return 'Pending';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'planned':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'under_review':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'closed':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'pending':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

