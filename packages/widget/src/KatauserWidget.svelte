<svelte:options customElement="katauser-widget" />

<script lang="ts">
  import TriggerButton from "./components/TriggerButton.svelte"
  import WidgetPanel from "./components/WidgetPanel.svelte"
  import ChangelogPopover from "./components/ChangelogPopover.svelte"
  import { shouldDisplayPopover } from "./changelog-helpers"
  import {
    globalWidgetState,
    type WidgetTab,
    type ChangelogSummary,
  } from "./sdk"

  let {
    workspace = "default",
    apiUrl = "http://localhost:3000",
    showPopover = true,
    position = "bottom-right",
  }: {
    workspace?: string
    apiUrl?: string
    showPopover?: boolean | string
    position?: "bottom-right" | "bottom-left"
  } = $props()

  const isPopoverConfigured = $derived(
    showPopover !== false && (showPopover as unknown) !== "false",
  )

  let isOpen = $state(globalWidgetState.isOpen)
  let activeTab = $state<WidgetTab>(globalWidgetState.activeTab)
  let unreadCount = $state(globalWidgetState.unreadCount)
  let currentUser = $state(globalWidgetState.user)
  let latestChangelog = $state<ChangelogSummary | null>(
    globalWidgetState.latestChangelog,
  )
  let isPopoverDismissed = $state(globalWidgetState.isPopoverDismissed)

  $effect(() => {
    // Keep local state in sync with global SDK state
    const unsubscribe = globalWidgetState.subscribe(() => {
      isOpen = globalWidgetState.isOpen
      activeTab = globalWidgetState.activeTab
      unreadCount = globalWidgetState.unreadCount
      currentUser = globalWidgetState.user
      latestChangelog = globalWidgetState.latestChangelog
      isPopoverDismissed = globalWidgetState.isPopoverDismissed
    })

    return unsubscribe
  })

  $effect(() => {
    // Fetch changelog status on mount
    globalWidgetState.syncChangelogStatus(workspace, apiUrl)
  })

  const isPopoverVisible = $derived(
    latestChangelog !== null &&
      isPopoverConfigured &&
      shouldDisplayPopover({
        isOpen,
        unreadCount,
        isDismissed: isPopoverDismissed,
        showPopover: globalWidgetState.showPopover,
      }),
  )

  function handleToggle() {
    globalWidgetState.toggle()
  }

  function handleClose() {
    globalWidgetState.close()
  }

  function handleOpenChangelog() {
    globalWidgetState.open()
    globalWidgetState.setActiveTab("changelog")
    if (latestChangelog) {
      globalWidgetState.markChangelogAsRead(
        workspace,
        latestChangelog.publishedAt,
      )
    }
  }

  function handleDismissPopover() {
    globalWidgetState.dismissPopover()
  }

  function handleTabChange(tab: WidgetTab) {
    globalWidgetState.setActiveTab(tab)
    if (tab === "changelog" && latestChangelog) {
      globalWidgetState.markChangelogAsRead(
        workspace,
        latestChangelog.publishedAt,
      )
    }
  }
</script>

<div class="katauser-host">
  {#if isPopoverVisible && latestChangelog}
    <ChangelogPopover
      latest={latestChangelog}
      {position}
      onOpen={handleOpenChangelog}
      onDismiss={handleDismissPopover}
    />
  {/if}

  <TriggerButton {isOpen} {unreadCount} onClick={handleToggle} />

  <WidgetPanel
    {isOpen}
    {activeTab}
    workspaceId={workspace}
    {apiUrl}
    user={currentUser}
    onTabChange={handleTabChange}
    onClose={handleClose}
  />
</div>

<style>
  :host {
    display: block;
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
      sans-serif;
  }
  .katauser-host {
    all: initial;
    font-family: inherit;
  }
</style>
