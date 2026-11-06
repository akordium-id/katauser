<script lang="ts">
  import VoteButton from "./VoteButton.svelte"
  import { formatPostStatus, getStatusBadgeColor } from "$lib/feedback-helpers"

  let {
    post,
    onVote,
    onClick,
  }: {
    post: {
      id: string
      title: string
      content: string
      status: string
      votesCount: number
      commentsCount: number
      createdAt: string
    }
    onVote?: (postId: string) => Promise<void> | void
    onClick?: () => void
  } = $props()
</script>

<div
  role="button"
  tabindex="0"
  onclick={onClick}
  onkeydown={(e) => e.key === "Enter" && onClick?.()}
  class="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
>
  <VoteButton postId={post.id} votesCount={post.votesCount} {onVote} />

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2 mb-1.5 flex-wrap">
      <h3
        class="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors"
      >
        {post.title}
      </h3>
      <span
        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border {getStatusBadgeColor(
          post.status,
        )}"
      >
        {formatPostStatus(post.status)}
      </span>
    </div>

    <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3">
      {post.content}
    </p>

    <div class="flex items-center gap-4 text-xs text-slate-400">
      <span class="inline-flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {post.commentsCount} komentar
      </span>
    </div>
  </div>
</div>
