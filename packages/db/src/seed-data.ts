import { randomBytes, scryptSync } from "node:crypto"

export function hashSeedPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export const SEED_ADMIN_USER = {
  id: "usr_demo_admin",
  name: "Faiq Admin",
  email: "demo@katauser.com",
  plainPassword: "katauser123",
  role: "admin",
  emailVerified: true,
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=FaiqAdmin",
}

export const SEED_WORKSPACE = {
  id: "ws_acme_demo",
  name: "Acme Corp",
  slug: "acme",
  customDomain: null,
  jwtSecret: "sec_demo_katauser_jwt_secret_key_32chars_long",
  plan: "pro",
  settings: {
    theme: "light",
    allowGuestSubmissions: true,
    notifySlack: true,
  },
}

export const SEED_WORKSPACE_MEMBER = {
  id: "wsm_demo_owner",
  workspaceId: SEED_WORKSPACE.id,
  userId: SEED_ADMIN_USER.id,
  role: "owner",
}

export const SEED_END_USERS = [
  {
    id: "eu_budi_enterprise",
    workspaceId: SEED_WORKSPACE.id,
    externalId: "ext_budi_01",
    email: "budi@techindo.id",
    name: "Budi Santoso",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
    metadata: {
      plan: "Enterprise",
      mrr: 299,
      company: "PT Tech Indo Mandiri",
    },
  },
  {
    id: "eu_siti_growth",
    workspaceId: SEED_WORKSPACE.id,
    externalId: "ext_siti_02",
    email: "siti@cloudscale.io",
    name: "Siti Rahma",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti",
    metadata: {
      plan: "Growth",
      mrr: 99,
      company: "CloudScale SaaS",
    },
  },
  {
    id: "eu_alex_starter",
    workspaceId: SEED_WORKSPACE.id,
    externalId: "ext_alex_03",
    email: "alex@digiagency.com",
    name: "Alex Chandra",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    metadata: {
      plan: "Starter",
      mrr: 49,
      company: "Digi Agency",
    },
  },
]

export const SEED_BOARDS = [
  {
    id: "brd_fitur",
    workspaceId: SEED_WORKSPACE.id,
    name: "Papan Ide & Fitur",
    slug: "fitur",
    description:
      "Kirimkan saran fitur baru yang Anda butuhkan untuk mempercepat perkembangan bisnis Anda.",
    isPrivate: false,
    allowGuestPosts: true,
  },
  {
    id: "brd_kendala",
    workspaceId: SEED_WORKSPACE.id,
    name: "Laporan Kendala & Bug",
    slug: "kendala",
    description:
      "Laporkan kendala teknis atau anomali UI yang Anda jumpai agar segera ditindaklanjuti tim teknis.",
    isPrivate: false,
    allowGuestPosts: true,
  },
]

export const SEED_POSTS = [
  {
    id: "pst_slack_discord_webhook",
    workspaceId: SEED_WORKSPACE.id,
    boardId: SEED_BOARDS[0].id,
    endUserId: SEED_END_USERS[0].id, // Budi (MRR $299)
    teamUserId: null,
    title: "Integrasi Discord & Slack Incoming Webhook",
    content:
      "Kami membutuhkan notifikasi instan ke channel internal tim Slack/Discord setiap kali ada ide baru atau eskalasi dari pelanggan penting.",
    status: "in_progress",
    votesCount: 54,
    commentsCount: 3,
  },
  {
    id: "pst_sso_okta_saml",
    workspaceId: SEED_WORKSPACE.id,
    boardId: SEED_BOARDS[0].id,
    endUserId: SEED_END_USERS[0].id, // Budi (MRR $299)
    teamUserId: null,
    title: "Single Sign-On (SSO) Berbasis SAML / Okta",
    content:
      "Untuk kepatuhan keamanan enterprise, seluruh tim kami wajib login menggunakan Identity Provider Okta melalui protokol SAML 2.0.",
    status: "planned",
    votesCount: 38,
    commentsCount: 2,
  },
  {
    id: "pst_dark_mode_embed",
    workspaceId: SEED_WORKSPACE.id,
    boardId: SEED_BOARDS[0].id,
    endUserId: SEED_END_USERS[1].id, // Siti (MRR $99)
    teamUserId: null,
    title: "Dukungan Tema Gelap (Dark Mode) di Widget Embed",
    content:
      "Aplikasi SaaS kami memakai tema gelap. Kami ingin widget embed Katauser otomatis menyesuaikan tema induk aplikasi atau preferensi sistem browser pengguna.",
    status: "completed",
    votesCount: 29,
    commentsCount: 4,
  },
  {
    id: "pst_export_csv_excel",
    workspaceId: SEED_WORKSPACE.id,
    boardId: SEED_BOARDS[0].id,
    endUserId: SEED_END_USERS[2].id, // Alex (MRR $49)
    teamUserId: null,
    title: "Fitur Ekspor Masukan Pengguna ke CSV & Excel",
    content:
      "Dukungan untuk mengunduh seluruh masukan, tanggal, dan nilai bobot MRR ke file tabular spreadsheet untuk laporan bulanan manajemen.",
    status: "under_review",
    votesCount: 16,
    commentsCount: 1,
  },
  {
    id: "pst_email_delivery_issue",
    workspaceId: SEED_WORKSPACE.id,
    boardId: SEED_BOARDS[1].id, // Kendala & Bug
    endUserId: SEED_END_USERS[1].id,
    teamUserId: null,
    title: "Notifikasi Email Sering Terlambat pada Domain Tertentu",
    content:
      "Email pengingat upvote dan balasan admin kadang membutuhkan waktu lebih dari 15 menit untuk sampai ke inbox Microsoft 365.",
    status: "completed",
    votesCount: 7,
    commentsCount: 2,
  },
]

export const SEED_VOTES = [
  {
    id: "vt_01",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[0].id,
    endUserId: SEED_END_USERS[0].id,
  },
  {
    id: "vt_02",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[0].id,
    endUserId: SEED_END_USERS[1].id,
  },
  {
    id: "vt_03",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[1].id,
    endUserId: SEED_END_USERS[0].id,
  },
  {
    id: "vt_04",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[2].id,
    endUserId: SEED_END_USERS[1].id,
  },
  {
    id: "vt_05",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[2].id,
    endUserId: SEED_END_USERS[2].id,
  },
]

export const SEED_COMMENTS = [
  {
    id: "cmt_01",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[0].id,
    endUserId: null,
    teamUserId: SEED_ADMIN_USER.id,
    content:
      "Halo Budi! Integrasi Slack & Discord saat ini sedang dalam tahap pengujian integrasi webhook dan dijadwalkan meluncur minggu ini.",
    isInternal: false,
  },
  {
    id: "cmt_02",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[0].id,
    endUserId: SEED_END_USERS[0].id,
    teamUserId: null,
    content:
      "Kabar luar biasa! Kami sudah menyiapkan channel #katauser-feedbacks di Slack internal tim.",
    isInternal: false,
  },
  {
    id: "cmt_03",
    workspaceId: SEED_WORKSPACE.id,
    postId: SEED_POSTS[2].id,
    endUserId: null,
    teamUserId: SEED_ADMIN_USER.id,
    content:
      "Dukungan Dark Mode resmi dirilis di versi widget v1.2.0! Silakan perbarui script tag embed Anda.",
    isInternal: false,
  },
]

export const SEED_CHANGELOG = {
  id: "chg_v1_2_0",
  workspaceId: SEED_WORKSPACE.id,
  title: "Rilis v1.2.0: Dukungan Penuh Dark Mode & Optimasi Performa Widget",
  slug: "v1-2-0-dark-mode-widget-optimization",
  content: `### Apa yang baru di versi 1.2.0:

- **Mode Gelap Otomatis**: Widget embed Katauser kini mendukung parameter \`theme: "auto" | "dark" | "light"\`.
- **Ukuran Bundle Lebih Ramping**: Total bundle SDK widget ditekan hingga di bawah 28 kB (gzip).
- **Perbaikan Pengiriman Email**: Mengatasi antrean pengiriman email SMTP pada penyedia enterprise.

Terima kasih atas seluruh masukan yang telah Anda kirimkan di papan ide!`,
  publishedAt: new Date().toISOString(),
  linkedPostIds: [SEED_POSTS[2].id],
}
