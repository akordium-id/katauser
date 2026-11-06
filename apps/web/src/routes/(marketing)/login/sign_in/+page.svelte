<script lang="ts">
  import { enhance } from "$app/forms"
  import { page } from "$app/stores"

  let { form } = $props()
  let loading = $state(false)
</script>

<svelte:head>
  <title>Sign In - Katauser</title>
</svelte:head>

{#if $page.url.searchParams.get("verified") == "true"}
  <div role="alert" class="alert alert-success mb-5">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="stroke-current shrink-0 h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>Email verified! Please sign in.</span>
  </div>
{/if}

<h1 class="text-2xl font-bold mb-6">Sign In</h1>

{#if form?.error}
  <div role="alert" class="alert alert-error mb-4 text-sm text-left">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="stroke-current shrink-0 h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{form.error}</span>
  </div>
{/if}

<form
  method="POST"
  class="flex flex-col gap-4 text-left"
  use:enhance={() => {
    loading = true
    return async ({ update }) => {
      loading = false
      await update()
    }
  }}
>
  <div class="form-control w-full">
    <label class="label" for="email">
      <span class="label-text font-medium">Email</span>
    </label>
    <input
      id="email"
      name="email"
      type="email"
      required
      placeholder="you@domain.com"
      value={form?.email ?? ""}
      class="input input-bordered w-full"
      autocomplete="email"
    />
  </div>

  <div class="form-control w-full">
    <label class="label" for="password">
      <span class="label-text font-medium">Password</span>
    </label>
    <input
      id="password"
      name="password"
      type="password"
      required
      placeholder="••••••••"
      class="input input-bordered w-full"
      autocomplete="current-password"
    />
  </div>

  <button
    type="submit"
    class="btn btn-primary w-full mt-2"
    disabled={loading}
  >
    {#if loading}
      <span class="loading loading-spinner loading-sm"></span>
      Signing in...
    {:else}
      Sign In
    {/if}
  </button>
</form>

<div class="text-sm text-slate-600 mt-6 text-center">
  <a class="link link-hover" href="/login/forgot_password">Forgot password?</a>
</div>
<div class="text-sm text-slate-600 mt-2 text-center">
  Don't have an account? <a class="link link-primary font-medium" href="/login/sign_up">Sign up</a>.
</div>
