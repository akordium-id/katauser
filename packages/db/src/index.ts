import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import { FeedbackRepository } from './repositories/feedback';
import { ChangelogRepository } from './repositories/changelog';

const { Pool } = pg;

export * from './schema';
export * from './repositories/feedback';
export * from './repositories/changelog';

export function createDbClient(connectionString: string) {
  const pool = new Pool({
    connectionString,
  });

  return drizzle(pool, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
