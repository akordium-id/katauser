<svelte:options customElement="katauser-widget" />

<script lang="ts">
  import TriggerButton from './components/TriggerButton.svelte';
  import WidgetPanel from './components/WidgetPanel.svelte';
  import { globalWidgetState, type WidgetTab } from './sdk';

  let {
    workspace = 'default',
    apiUrl = 'http://localhost:3000',
  }: {
    workspace?: string;
    apiUrl?: string;
  } = $props();

  let isOpen = $state(globalWidgetState.isOpen);
  let activeTab = $state<WidgetTab>(globalWidgetState.activeTab);
  let unreadCount = $state(globalWidgetState.unreadCount);
  let currentUser = $state(globalWidgetState.user);

  $effect(() => {
    // Keep local state in sync with global SDK state
    const unsubscribe = globalWidgetState.subscribe(() => {
      isOpen = globalWidgetState.isOpen;
      activeTab = globalWidgetState.activeTab;
      unreadCount = globalWidgetState.unreadCount;
      currentUser = globalWidgetState.user;
    });

    return unsubscribe;
  });

  function handleToggle() {
    globalWidgetState.toggle();
  }

  function handleClose() {
    globalWidgetState.close();
  }

  function handleTabChange(tab: WidgetTab) {
    globalWidgetState.setActiveTab(tab);
  }
</script>

<div class="katauser-host">
  <TriggerButton
    {isOpen}
    {unreadCount}
    onClick={handleToggle}
  />

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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .katauser-host {
    all: initial;
    font-family: inherit;
  }
</style>
