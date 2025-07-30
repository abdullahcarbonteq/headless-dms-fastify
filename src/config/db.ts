import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from './index.js';

const pool = new Pool({
  connectionString: config.database.url,
});

export const db = drizzle(pool);
