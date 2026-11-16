import pg from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"
import {
  SEED_ADMIN_USER,
  SEED_WORKSPACE,
  SEED_WORKSPACE_MEMBER,
  SEED_END_USERS,
  SEED_BOARDS,
  SEED_POSTS,
  SEED_VOTES,
  SEED_COMMENTS,
  SEED_CHANGELOG,
  hashSeedPassword,
} from "./seed-data"

const { Pool } = pg

export async function runSeed(connectionString?: string) {
  const dbUrl =
    connectionString ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/katauser"

  console.log(`[seed] Connecting to database...`)
  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool, { schema })

  try {
    console.log(`[seed] Seeding admin user (${SEED_ADMIN_USER.email})...`)
    const hashedPassword = hashSeedPassword(SEED_ADMIN_USER.plainPassword)

    await db
      .insert(schema.users)
      .values({
        id: SEED_ADMIN_USER.id,
        name: SEED_ADMIN_USER.name,
        email: SEED_ADMIN_USER.email,
        emailVerified: SEED_ADMIN_USER.emailVerified,
        image: SEED_ADMIN_USER.image,
        role: SEED_ADMIN_USER.role,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          name: SEED_ADMIN_USER.name,
          email: SEED_ADMIN_USER.email,
          image: SEED_ADMIN_USER.image,
          role: SEED_ADMIN_USER.role,
          updatedAt: new Date(),
        },
      })

    await db
      .insert(schema.accounts)
      .values({
        id: `acc_${SEED_ADMIN_USER.id}`,
        userId: SEED_ADMIN_USER.id,
        accountId: SEED_ADMIN_USER.email,
        providerId: "credential",
        password: hashedPassword,
      })
      .onConflictDoUpdate({
        target: schema.accounts.id,
        set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      })

    console.log(`[seed] Seeding workspace (${SEED_WORKSPACE.name} - /${SEED_WORKSPACE.slug})...`)
    await db
      .insert(schema.workspaces)
      .values({
        id: SEED_WORKSPACE.id,
        name: SEED_WORKSPACE.name,
        slug: SEED_WORKSPACE.slug,
        customDomain: SEED_WORKSPACE.customDomain,
        jwtSecret: SEED_WORKSPACE.jwtSecret,
        plan: SEED_WORKSPACE.plan,
        settings: SEED_WORKSPACE.settings,
      })
      .onConflictDoUpdate({
        target: schema.workspaces.id,
        set: {
          name: SEED_WORKSPACE.name,
          plan: SEED_WORKSPACE.plan,
          settings: SEED_WORKSPACE.settings,
          updatedAt: new Date(),
        },
      })

    await db
      .insert(schema.workspaceMembers)
      .values({
        id: SEED_WORKSPACE_MEMBER.id,
        workspaceId: SEED_WORKSPACE_MEMBER.workspaceId,
        userId: SEED_WORKSPACE_MEMBER.userId,
        role: SEED_WORKSPACE_MEMBER.role,
      })
      .onConflictDoNothing()

    console.log(`[seed] Seeding end users (${SEED_END_USERS.length} customer personas)...`)
    for (const eu of SEED_END_USERS) {
      await db
        .insert(schema.endUsers)
        .values({
          id: eu.id,
          workspaceId: eu.workspaceId,
          externalId: eu.externalId,
          email: eu.email,
          name: eu.name,
          avatarUrl: eu.avatarUrl,
          metadata: eu.metadata,
        })
        .onConflictDoUpdate({
          target: schema.endUsers.id,
          set: {
            name: eu.name,
            email: eu.email,
            avatarUrl: eu.avatarUrl,
            metadata: eu.metadata,
          },
        })
    }

    console.log(`[seed] Seeding boards (${SEED_BOARDS.length} boards)...`)
    for (const b of SEED_BOARDS) {
      await db
        .insert(schema.boards)
        .values({
          id: b.id,
          workspaceId: b.workspaceId,
          name: b.name,
          slug: b.slug,
          description: b.description,
          isPrivate: b.isPrivate,
          allowGuestPosts: b.allowGuestPosts,
        })
        .onConflictDoUpdate({
          target: schema.boards.id,
          set: {
            name: b.name,
            slug: b.slug,
            description: b.description,
            updatedAt: new Date(),
          },
        })
    }

    console.log(`[seed] Seeding feedback posts (${SEED_POSTS.length} posts)...`)
    for (const p of SEED_POSTS) {
      await db
        .insert(schema.posts)
        .values({
          id: p.id,
          workspaceId: p.workspaceId,
          boardId: p.boardId,
          endUserId: p.endUserId,
          teamUserId: p.teamUserId,
          title: p.title,
          content: p.content,
          status: p.status,
          votesCount: p.votesCount,
          commentsCount: p.commentsCount,
        })
        .onConflictDoUpdate({
          target: schema.posts.id,
          set: {
            title: p.title,
            content: p.content,
            status: p.status,
            votesCount: p.votesCount,
            commentsCount: p.commentsCount,
            updatedAt: new Date(),
          },
        })
    }

    console.log(`[seed] Seeding votes (${SEED_VOTES.length} votes)...`)
    for (const v of SEED_VOTES) {
      await db
        .insert(schema.votes)
        .values({
          id: v.id,
          workspaceId: v.workspaceId,
          postId: v.postId,
          endUserId: v.endUserId,
        })
        .onConflictDoNothing()
    }

    console.log(`[seed] Seeding comments (${SEED_COMMENTS.length} comments)...`)
    for (const c of SEED_COMMENTS) {
      await db
        .insert(schema.comments)
        .values({
          id: c.id,
          workspaceId: c.workspaceId,
          postId: c.postId,
          endUserId: c.endUserId,
          teamUserId: c.teamUserId,
          content: c.content,
          isInternal: c.isInternal,
        })
        .onConflictDoNothing()
    }

    console.log(`[seed] Seeding changelog release (${SEED_CHANGELOG.title})...`)
    await db
      .insert(schema.changelogs)
      .values({
        id: SEED_CHANGELOG.id,
        workspaceId: SEED_CHANGELOG.workspaceId,
        title: SEED_CHANGELOG.title,
        slug: SEED_CHANGELOG.slug,
        content: SEED_CHANGELOG.content,
        publishedAt: new Date(SEED_CHANGELOG.publishedAt),
      })
      .onConflictDoUpdate({
        target: schema.changelogs.id,
        set: {
          title: SEED_CHANGELOG.title,
          content: SEED_CHANGELOG.content,
          publishedAt: new Date(SEED_CHANGELOG.publishedAt),
          updatedAt: new Date(),
        },
      })

    for (const postId of SEED_CHANGELOG.linkedPostIds) {
      await db
        .insert(schema.changelogPosts)
        .values({
          changelogId: SEED_CHANGELOG.id,
          postId,
        })
        .onConflictDoNothing()
    }

    console.log(`[seed] Database seeding completed successfully!`)
    return { success: true }
  } finally {
    await pool.end()
  }
}

// Execute directly if run via CLI
const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("seed.ts")

if (isDirectRun) {
  runSeed()
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      console.error(`[seed] Failed to seed database:`, err)
      process.exit(1)
    })
}
