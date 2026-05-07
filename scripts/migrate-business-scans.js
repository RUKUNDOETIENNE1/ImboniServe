require('dotenv').config();
const { Client } = require('pg');

async function runMigration() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('ERROR: No DATABASE_URL or DIRECT_URL found in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Ensure pgcrypto extension for gen_random_uuid()
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    } catch (e) {
      console.warn('! Could not ensure pgcrypto extension (non-fatal):', e.message);
    }

    // Create business_scans table (if not exists)
    console.log('Creating business_scans table (if needed)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "business_scans" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "score" INTEGER NOT NULL,
        "primary_issue" TEXT NOT NULL,
        "critical_issues" JSONB NOT NULL DEFAULT '[]',
        "medium_issues" JSONB NOT NULL DEFAULT '[]',
        "opportunities" JSONB NOT NULL DEFAULT '[]',
        "quick_wins" JSONB NOT NULL DEFAULT '[]',
        "raw_ai_response" TEXT
      );
    `);
    console.log('✓ business_scans table exists');

    // Ensure user_id is TEXT and FK exists (handle previous failed UUID attempts)
    console.log('Ensuring user_id type and foreign key constraint...');
    await client.query(`
      DO $$
      BEGIN
        -- Drop FK if exists (in case type change is needed)
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'business_scans_user_id_fkey'
            AND table_name = 'business_scans'
        ) THEN
          ALTER TABLE "business_scans" DROP CONSTRAINT "business_scans_user_id_fkey";
        END IF;

        -- If user_id is not text, alter it
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'business_scans' AND column_name = 'user_id' AND data_type <> 'text'
        ) THEN
          ALTER TABLE "business_scans" ALTER COLUMN "user_id" TYPE TEXT USING "user_id"::text;
        END IF;

        -- Recreate FK
        ALTER TABLE "business_scans"
          ADD CONSTRAINT "business_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END $$;
    `);
    console.log('✓ user_id type and FK ensured');

    // Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "business_scans_user_id_idx" ON "business_scans"("user_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "business_scans_created_at_idx" ON "business_scans"("created_at" DESC);
    `);
    console.log('✓ Indexes created');

    console.log('\n========================================');
    console.log('✓ Business Scans migration completed successfully!');
    console.log('========================================\n');

  } catch (error) {
    console.error('ERROR during migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
