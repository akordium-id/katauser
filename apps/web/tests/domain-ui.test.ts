import { describe, it, expect } from "vitest"
import {
  getDomainStatusMeta,
  getDnsInstruction,
} from "../src/lib/domain-ui-helpers"

describe("Admin Domain Settings UI Helpers", () => {
  it("returns verified vs pending status badge metadata", () => {
    const verified = getDomainStatusMeta(true)
    expect(verified.label).toBe("Aktif & Terverifikasi")
    expect(verified.color).toContain("emerald")

    const pending = getDomainStatusMeta(false)
    expect(pending.label).toBe("Menunggu Konfigurasi DNS")
    expect(pending.color).toContain("amber")
  })

  it("provides provider-specific DNS instructions", () => {
    const cf = getDnsInstruction("cloudflare")
    expect(cf.type).toBe("CNAME")
    expect(cf.target).toBe("cname.katauser.com")
    expect(cf.proxyNotice).toContain("DNS Only")

    const general = getDnsInstruction("general")
    expect(general.type).toBe("CNAME")
    expect(general.target).toBe("cname.katauser.com")
  })
})
