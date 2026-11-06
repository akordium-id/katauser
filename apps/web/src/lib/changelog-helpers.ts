export interface TagMeta {
  label: string;
  badgeClass: string;
}

export function formatChangelogDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getChangelogTagMeta(tag: string): TagMeta {
  switch (tag.toLowerCase()) {
    case 'feature':
      return {
        label: 'New Feature',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    case 'improvement':
      return {
        label: 'Improvement',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      };
    case 'fix':
      return {
        label: 'Bug Fix',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    default:
      return {
        label: tag,
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      };
  }
}

