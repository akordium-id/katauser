<script lang="ts">
  let submitted = $state(false)
  let email = $state("")
</script>

<svelte:head>
  <title>Forgot Password - Katauser</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Forgot Password</h1>

{#if submitted}
  <div role="alert" class="alert alert-info mb-6 text-left">
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span
      >Jika email {email} terdaftar, petunjuk reset password telah dikirim.</span
    >
  </div>
{:else}
  <p class="text-sm text-slate-600 mb-6 text-left">
    Masukkan alamat email Anda untuk menerima instruksi pemulihan kata sandi.
  </p>

  <form
    onsubmit={(e) => {
      e.preventDefault()
      submitted = true
    }}
    class="flex flex-col gap-4 text-left"
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
        bind:value={email}
        placeholder="you@domain.com"
        class="input input-bordered w-full"
        autocomplete="email"
      />
    </div>

    <button type="submit" class="btn btn-primary w-full mt-2">
      Kirim Link Reset
    </button>
  </form>
{/if}

<div class="text-sm text-slate-600 mt-6 text-center">
  Ingat kata sandi? <a
    class="link link-primary font-medium"
    href="/login/sign_in">Sign in</a
  >.
</div>
