/*
  Autopilot DB Migration Runner (Windows-friendly)
  - Reads DATABASE_URL (or DIRECT_URL) from .env
  - Executes safe_business_migration_steps_1_4.sql then safe_business_constraints.sql
  - Idempotent: files are guarded with IF NOT EXISTS / DO $$ checks
*/

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

function readSqlFile(relativePath) {
  const full = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(full)) {
    throw new Error(`SQL file not found: ${full}`);
  }
  return fs.readFileSync(full, 'utf8');
}

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL (or DIRECT_URL) not found in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database (using pooler URL)...');
    await client.connect();
    console.log('✓ Connected');

    const step14Path = path.join('prisma', 'migrations', 'safe_business_migration_steps_1_4.sql');
    const step5Path = path.join('prisma', 'migrations', 'safe_business_constraints.sql');

    console.log(`\nRunning Steps 1-4: ${step14Path}`);
    const sql14 = readSqlFile(step14Path);
    await client.query(sql14);
    console.log('✓ Steps 1-4 completed (columns, tables, indexes)');

    console.log(`\nRunning Step 5 (guarded FKs): ${step5Path}`);
    const sql5 = readSqlFile(step5Path);
    await client.query(sql5);
    console.log('✓ Step 5 completed (foreign keys)');

    console.log('\nAll migration steps completed successfully.');
  } catch (err) {
    console.error('\nERROR during migration:', err.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

run();
