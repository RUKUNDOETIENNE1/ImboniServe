const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'prisma', 'migrations', '20260601081228_billing_ledger', 'migration.sql');
let content = fs.readFileSync(filePath, 'utf8');

// Fix doubly-wrapped DO $$ blocks
// Pattern: DO $ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'X') THEN DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'X') THEN ALTER TABLE ... END IF; END $$; END IF; END $;
// Should be: DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'X') THEN ALTER TABLE ... END IF; END $$;

const doubleWrappedRegex = /DO \$ BEGIN IF NOT EXISTS \(SELECT 1 FROM pg_constraint WHERE conname = '([^']+)'\) THEN DO \$\$ BEGIN IF NOT EXISTS \(SELECT 1 FROM pg_constraint WHERE conname = '([^']+)'\) THEN (ALTER TABLE .*?;) END IF; END \$\$; END IF; END \$;/g;

let count = 0;
content = content.replace(doubleWrappedRegex, (match, name1, name2, alterStatement) => {
  count++;
  return `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name2}') THEN ${alterStatement} END IF; END $$;`;
});

// Also fix any remaining single $ that should be $$
content = content.replace(/DO \$ BEGIN/g, 'DO $$ BEGIN');
content = content.replace(/END \$;/g, 'END $$;');

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Fixed ${count} doubly-wrapped DO $$ blocks`);
