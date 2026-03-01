import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://orbos:orbos@localhost:5432/orbos';

export const db = drizzle(databaseUrl, { schema });
export type Database = typeof db;
