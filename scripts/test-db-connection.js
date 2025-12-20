require('dotenv').config();
const { Client } = require('pg');

const conn = process.env.DATABASE_URL || `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

console.log('Using connection string:', conn.replace(/(:).*(@)/, ':*****$2'));

const client = new Client({ connectionString: conn });

(async () => {
  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now');
    console.log('Connected. Server time:', res.rows[0].now);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    if (err.code) console.error('PG error code:', err.code);
    process.exit(1);
  }
})();
