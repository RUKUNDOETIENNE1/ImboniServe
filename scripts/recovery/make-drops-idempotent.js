const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'prisma', 'migrations', '20260601081228_billing_ledger', 'migration.sql');
let content = fs.readFileSync(filePath, 'utf8');

// Make DROP CONSTRAINT idempotent
// Match: ALTER TABLE "TableName" DROP CONSTRAINT "ConstraintName";
const dropConstraintRegex = /ALTER TABLE "([^"]+)" DROP CONSTRAINT "([^"]+)";/g;
let dropCount = 0;
content = content.replace(dropConstraintRegex, (match, table, constraint) => {
  dropCount++;
  return `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}";`;
});

// Make DROP COLUMN idempotent
// Match: ALTER TABLE "TableName" DROP COLUMN "ColumnName",
// or within multi-column ALTER TABLE statements
// Pattern: DROP COLUMN "xxx"
const dropColumnRegex = /DROP COLUMN "([^"]+)"/g;
let dropColCount = 0;
content = content.replace(dropColumnRegex, (match, col) => {
  dropColCount++;
  return `DROP COLUMN IF EXISTS "${col}"`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Made ${dropCount} DROP CONSTRAINT statements idempotent`);
console.log(`Made ${dropColCount} DROP COLUMN statements idempotent`);
