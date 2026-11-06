<script lang="ts">
  let {
    postId,
    votesCount = 0,
    hasVoted = false,
    onVote,
  }: {
    postId: string
    votesCount: number
    hasVoted?: boolean
    onVote?: (postId: string) => Promise<void> | void
  } = $props()

  let loading = $state(false)

  async function handleClick(e: MouseEvent) {
    e.stopPropagation()
    if (loading || !onVote) return
    loading = true
    try {
      await onVote(postId)
    } finally {
      loading = false
    }
  }
</script>

<button
  type="button"
  onclick={handleClick}
  disabled={loading}
  aria-label={`Vote for post (current votes: ${votesCount})`}
  class="flex flex-col items-center justify-center rounded-lg border px-3 py-2 transition-all duration-150 {hasVoted
    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-4 w-4 transition-transform duration-150 {hasVoted
      ? 'fill-current'
      : ''} {loading ? 'animate-bounce' : ''}"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2.5"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
  </svg>
  <span class="mt-0.5 text-xs font-semibold">{votesCount}</span>
</button>
