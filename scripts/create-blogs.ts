import { pool } from "../server/db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blogs (
      id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log("✓ blogs table created (or already exists)");
  await pool.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
