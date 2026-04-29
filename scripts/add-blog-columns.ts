import { pool } from "../server/db";

async function run() {
  await pool.query(`ALTER TABLE blog_submissions ADD COLUMN IF NOT EXISTS blog_id VARCHAR(50)`);
  console.log("✓ blog_id column added to blog_submissions");
  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
