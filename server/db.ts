import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { config as loadEnv } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables for both Node 18 (dotenv) and Node 20+ (loadEnvFile)
// Only load .env file if it exists (for development)
// In production, env vars are provided by the platform
const envPath = path.join(process.cwd(), ".env");
if (typeof (process as any).loadEnvFile === "function" && fs.existsSync(envPath)) {
  (process as any).loadEnvFile();
} else if (fs.existsSync(envPath)) {
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