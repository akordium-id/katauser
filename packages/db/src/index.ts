import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

export * from './schema';

export function createDbClient(connectionString: string) {
  const pool = new Pool({
    connectionString,
  });

  return drizzle(pool, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
