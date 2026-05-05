import { pool } from "../server/db";

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_submissions (
      id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      featured_image TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      submitted_by_id VARCHAR(50) NOT NULL,
      submitted_by_name VARCHAR(255) NOT NULL,
      submitted_by_email VARCHAR(255) NOT NULL,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
  console.log("✓ blog_submissions table created (or already exists)");
  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
