import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';

export async function setupTestDatabase() {
  // Create test database connection
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'headless_dms_test',  // Separate test database
    max: 1  // Single connection for tests
  });

  const db = drizzle(pool);

  try {
    // Run migrations to create tables
    await migrate(db, { migrationsFolder: './drizzle' });
    
    // Seed with basic test data
    await seedTestData(db);
    
    return db;
  } catch (error) {
    console.error('Failed to setup test database:', error);
    await pool.end();
    throw error;
  }
}

export async function cleanupTestDatabase(db: any): Promise<void> {
  try {
    // Clean up all test data
    await db.execute(sql`TRUNCATE TABLE documents CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  } finally {
    // Close database connection
    if (db.$pool) {
      await db.$pool.end();
    }
  }
}

async function seedTestData(db: any): Promise<void> {
  // Optional: Add some basic test data if needed
  // This is optional - you might want clean database for each test
  console.log('Test database setup complete');
} 