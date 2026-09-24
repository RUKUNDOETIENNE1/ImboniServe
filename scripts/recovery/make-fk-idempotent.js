const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'prisma', 'migrations', '20260601081228_billing_ledger', 'migration.sql');
let content = fs.readFileSync(filePath, 'utf8');

// Match: ALTER TABLE "TableName" ADD CONSTRAINT "ConstraintName" FOREIGN KEY ("col") REFERENCES "RefTable"("refcol") ON DELETE ... ON UPDATE ...;
const fkRegex = /ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" FOREIGN KEY \("([^"]+)"\) REFERENCES "([^"]+)"\("([^"]+)"\) ON DELETE ([^ ]+) ON UPDATE ([^;]+);/g;

let count = 0;
content = content.replace(fkRegex, (match, table, constraint, col, refTable, refCol, onDelete, onUpdate) => {
  count++;
  return `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraint}') THEN ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${col}") REFERENCES "${refTable}"("${refCol}") ON DELETE ${onDelete} ON UPDATE ${onUpdate}; END IF; END $$;`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Replaced ${count} FK constraints with idempotent DO $$ blocks`);
