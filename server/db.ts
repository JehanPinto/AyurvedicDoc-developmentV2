import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { config as loadEnv } from "dotenv";

// Load environment variables for both Node 18 (dotenv) and Node 20+ (loadEnvFile)
if (typeof (process as any).loadEnvFile === "function") {
  (process as any).loadEnvFile();
} else {
  loadEnv();
}

const databaseUrl = process.env.DATABASE_URL;

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