import { serve } from "@hono/node-server"
import { app } from "./app"

const port = Number(process.env.PORT) || 4000

console.log(`🚀 Katauser API server running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})

export * from "./app"
