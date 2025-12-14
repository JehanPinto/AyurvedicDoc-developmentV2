import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// prefer DATABASE_URL; fall back to PG env vars
const databaseUrl = process.env.DATABASE_URL || (
  process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE
    ? `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}`
    : undefined
);

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set (or PGHOST/PGUSER/PGDATABASE).",
  );
}

// Log resolved DB host/db (do NOT log password)
try {
  const url = new URL(databaseUrl);
  console.log(`Using database host=${url.hostname} db=${url.pathname.replace('/', '')}`);
} catch {
  // ignore
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
