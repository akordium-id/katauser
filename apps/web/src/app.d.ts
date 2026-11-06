// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface User {
      id: string
      email: string
      name: string
      role: string
    }

    interface Locals {
      user: User | null
      sessionToken: string | null
    }

    interface PageData {
      user?: User | null
    }
  }
}

export {}
