const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'prisma', 'migrations', '20260601081228_billing_ledger', 'migration.sql');
let content = fs.readFileSync(filePath, 'utf8');

// Fix: CREATE TYPE IF NOT EXISTS is not valid PostgreSQL
// Replace with DO $$ blocks that check if the type exists
const createTypeRegex = /CREATE TYPE IF NOT EXISTS "([^"]+)" AS ENUM \(([^)]+)\);/g;
let count = 0;
content = content.replace(createTypeRegex, (match, typeName, enumValues) => {
  count++;
  return `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = '${typeName}') THEN CREATE TYPE "${typeName}" AS ENUM (${enumValues}); END IF; END $$;`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Replaced ${count} CREATE TYPE IF NOT EXISTS with DO $$ blocks`);
