#!/usr/bin/env node
import { runStdioServer } from "../dist/index.js"

runStdioServer().catch((error) => {
  console.error("Fatal error in Katauser MCP Server:", error)
  process.exit(1)
})
