const fs = require('fs');
const path = require('path');

const termbasePath = path.join(__dirname, '..', 'src', 'locales', 'VERIFIED_KINYARWANDA_TERMBASE.json');
const rwPath = path.join(__dirname, '..', 'src', 'locales', 'rw.json');
const reservePath = path.join(__dirname, '..', 'RW_TERMBASE_RESERVE_LIST.md');

const termbase = JSON.parse(fs.readFileSync(termbasePath, 'utf8'));
const rw = JSON.parse(fs.readFileSync(rwPath, 'utf8'));

// Deep merge: for each key in termbase, set it in rw (overwriting existing)
// But preserve any nested keys in rw that aren't in termbase
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Find keys in rw that are NOT in termbase (reserve list)
function findMissingKeys(rwKeys, termbaseKeys, prefix = '') {
  const missing = [];
  for (const key of rwKeys) {
    if (!(key in termbaseKeys)) {
      missing.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  return missing;
}

// Count all leaf keys recursively
function countLeafKeys(obj, prefix = '') {
  let count = 0;
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const sub = countLeafKeys(obj[key], fullKey);
      count += sub.count;
      keys.push(...sub.keys);
    } else {
      count++;
      keys.push(fullKey);
    }
  }
  return { count, keys };
}

// Top-level keys in termbase not in rw (new keys to add)
const newKeys = Object.keys(termbase).filter(k => !(k in rw));
// Top-level keys in rw not in termbase (reserve list)
const reserveKeys = Object.keys(rw).filter(k => !(k in termbase));
// Top-level keys in both (updated)
const updatedKeys = Object.keys(termbase).filter(k => k in rw);

console.log('=== Synchronization Report ===');
console.log(`Termbase top-level keys: ${Object.keys(termbase).length}`);
console.log(`rw.json top-level keys: ${Object.keys(rw).length}`);
console.log(`Keys updated (in both): ${updatedKeys.length}`);
console.log(`New keys added to rw.json: ${newKeys.length}`);
console.log(`Reserve keys (in rw, not in termbase): ${reserveKeys.length}`);

if (newKeys.length > 0) {
  console.log('\nNew keys:');
  newKeys.forEach(k => console.log(`  + ${k}`));
}

if (reserveKeys.length > 0) {
  console.log('\nReserve keys:');
  reserveKeys.forEach(k => console.log(`  - ${k}`));
}

// Deep merge termbase into rw
const synced = deepMerge(rw, termbase);

// Write synced rw.json
fs.writeFileSync(rwPath, JSON.stringify(synced, null, 2) + '\n', 'utf8');
console.log(`\nSynced rw.json written to ${rwPath}`);

// Count leaf keys
const termbaseLeaves = countLeafKeys(termbase);
const syncedLeaves = countLeafKeys(synced);
console.log(`\nTermbase leaf keys: ${termbaseLeaves.count}`);
console.log(`Synced rw.json leaf keys: ${syncedLeaves.count}`);

// Write reserve list
let reserveMd = '# RW Termbase Reserve List\n\n';
reserveMd += 'Keys in `rw.json` that are NOT in the verified termbase.\n';
reserveMd += 'These keys were preserved during synchronization but may need review.\n\n';
reserveMd += `**Generated:** ${new Date().toISOString()}\n\n`;
reserveMd += `**Total reserve keys:** ${reserveKeys.length}\n\n`;

if (reserveKeys.length > 0) {
  reserveMd += '| # | Key |\n|---|-----|\n';
  reserveKeys.forEach((k, i) => {
    reserveMd += `| ${i + 1} | \`${k}\` |\n`;
  });
} else {
  reserveMd += '_No reserve keys._\n';
}

fs.writeFileSync(reservePath, reserveMd, 'utf8');
console.log(`Reserve list written to ${reservePath}`);

// Verify synced file is valid JSON
try {
  JSON.parse(fs.readFileSync(rwPath, 'utf8'));
  console.log('\nVerification: rw.json is valid JSON ✓');
} catch (e) {
  console.error('Verification FAILED: rw.json is invalid JSON!', e.message);
  process.exit(1);
}
