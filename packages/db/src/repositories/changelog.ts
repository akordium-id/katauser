import { eq, and, desc, inArray, isNotNull } from 'drizzle-orm';
import { changelogs, changelogPosts } from '../schema/changelog';
import { posts, votes } from '../schema/feedback';
import { endUsers } from '../schema/workspaces';

export class ChangelogRepository {
  constructor(private db: any) {}

  async createChangelog(params: {
    workspaceId: string;
    title: string;
    slug: string;
    content: string;
    publishedAt?: Date | string | null;
    postIds?: string[];
  }) {
    const changelogId = 'ch_' + Math.random().toString(36).substring(2, 10);
    const pubDate = params.publishedAt ? new Date(params.publishedAt) : new Date();

    return this.db.transaction(async (tx: any) => {
      const [newChangelog] = await tx
        .insert(changelogs)
        .values({
          id: changelogId,
          workspaceId: params.workspaceId,
          title: params.title,
          slug: params.slug,
          content: params.content,
          publishedAt: pubDate,
        })
        .returning();

      if (params.postIds && params.postIds.length > 0) {
        const linkValues = params.postIds.map((postId) => ({
          changelogId,
          postId,
        }));
        await tx.insert(changelogPosts).values(linkValues);
      }

      return newChangelog;
    });
  }

  async getPublishedChangelogs(workspaceId: string) {
    return this.db
      .select()
      .from(changelogs)
      .where(
        and(
          eq(changelogs.workspaceId, workspaceId),
          isNotNull(changelogs.publishedAt)
        )
      )
      .orderBy(desc(changelogs.publishedAt));
  }

  async getRoadmapGroupedPosts(workspaceId: string) {
    const allPosts = await this.db
      .select()
      .from(posts)
      .where(eq(posts.workspaceId, workspaceId))
      .orderBy(desc(posts.votesCount));

    const planned = allPosts.filter((p: any) => p.status === 'planned');
    const inProgress = allPosts.filter((p: any) => p.status === 'in_progress');
    const completed = allPosts.filter((p: any) => p.status === 'completed');

    return {
      planned,
      inProgress,
      completed,
    };
  }

  async getVoterEmailsForPosts(postIds: string[]): Promise<string[]> {
    if (!postIds || postIds.length === 0) return [];

    const voterRows = await this.db
      .select({ email: endUsers.email })
      .from(votes)
      .innerJoin(endUsers, eq(votes.endUserId, endUsers.id))
      .where(inArray(votes.postId, postIds));

    const emails = voterRows
      .map((row: any) => row.email)
      .filter((email: any): email is string => Boolean(email));

    // Deduplicate
    return Array.from(new Set(emails));
  }
}

