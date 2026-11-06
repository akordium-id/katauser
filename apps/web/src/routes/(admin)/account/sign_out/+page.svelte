<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"

  onMount(() => {
    goto("/")
  })
</script>

<svelte:head>
  <title>Signing Out - Katauser</title>
</svelte:head>

<h1 class="text-2xl font-bold m-6 mx-auto my-auto text-center">
  Signing out....
</h1>
