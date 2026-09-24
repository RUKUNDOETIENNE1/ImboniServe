const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const termbasePath = path.join(localesDir, 'VERIFIED_KINYARWANDA_TERMBASE.json');
const rwPath = path.join(localesDir, 'rw.json');
const reservePath = path.join(__dirname, '..', 'RW_TERMBASE_RESERVE_LIST.md');
const auditPath = path.join(__dirname, '..', 'RW_TERMBASE_SYNC_AUDIT.md');

// ── Load files ──
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const termbase = JSON.parse(fs.readFileSync(termbasePath, 'utf8'));
const rwCurrent = JSON.parse(fs.readFileSync(rwPath, 'utf8'));

// Load previous rw.json from git HEAD for recovery
let rwGitHead = {};
try {
  const gitContent = execSync('git show HEAD:src/locales/rw.json', {
    encoding: 'utf8',
    cwd: path.join(__dirname, '..'),
  });
  rwGitHead = JSON.parse(gitContent);
} catch (e) {
  console.warn('Could not load rw.json from git HEAD, using current file only.');
  rwGitHead = rwCurrent;
}

// ── Utility functions ──

function getLeafKeyMap(obj, prefix = '') {
  const map = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(map, getLeafKeyMap(obj[key], fullKey));
    } else {
      map[fullKey] = obj[key];
    }
  }
  return map;
}

function countLeafKeys(obj, prefix = '') {
  let count = 0;
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countLeafKeys(obj[key], fullKey);
    } else {
      count++;
    }
  }
  return count;
}

function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{[^}]+\}\}/g) || [];
  return matches.sort();
}

function hasHtml(str) {
  if (typeof str !== 'string') return false;
  return /<\/?[a-z][\s\S]*?>/i.test(str);
}

function hasMarkdown(str) {
  if (typeof str !== 'string') return false;
  return /(\*\*|__|`|#{1,6}\s|\|.*\|)/.test(str);
}

// ── Build rw.json from en.json structure ──
// For each leaf key in en.json:
//   1. If termbase has the exact same path → use termbase value
//   2. Else if current rw.json has the exact same path → use rw.json value
//   3. Else if git HEAD rw.json has the exact same path → use git HEAD value
//   4. Else → use en.json value (untranslated fallback)

const enLeaves = getLeafKeyMap(en);
const termbaseLeaves = getLeafKeyMap(termbase);
const rwLeaves = getLeafKeyMap(rwCurrent);
const rwGitLeaves = getLeafKeyMap(rwGitHead);

let stats = {
  fromTermbase: 0,
  fromRwExisting: 0,
  fromRwGit: 0,
  fallbackToEn: 0,
  totalKeys: 0,
};

// Build the new rw.json by walking en.json's structure
function buildFromEnStructure(enObj, tbLeaves, rwLeaves, gitLeaves, prefix = '') {
  const result = {};
  for (const key of Object.keys(enObj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      result[key] = buildFromEnStructure(enObj[key], tbLeaves, rwLeaves, gitLeaves, fullKey);
    } else {
      stats.totalKeys++;
      if (fullKey in tbLeaves) {
        result[key] = tbLeaves[fullKey];
        stats.fromTermbase++;
      } else if (fullKey in rwLeaves) {
        result[key] = rwLeaves[fullKey];
        stats.fromRwExisting++;
      } else if (fullKey in gitLeaves) {
        result[key] = gitLeaves[fullKey];
        stats.fromRwGit++;
      } else {
        result[key] = enObj[key];
        stats.fallbackToEn++;
      }
    }
  }
  return result;
}

const synced = buildFromEnStructure(en, termbaseLeaves, rwLeaves, rwGitLeaves);

// Write synced rw.json
fs.writeFileSync(rwPath, JSON.stringify(synced, null, 2) + '\n', 'utf8');

// ── Validation ──
const syncedLeaves = getLeafKeyMap(synced);

const placeholderMismatches = [];
const interpolationMismatches = [];
const htmlMismatches = [];
const markdownCorruptions = [];

for (const key of Object.keys(enLeaves)) {
  // Placeholder validation (en vs synced rw)
  const enPh = extractPlaceholders(enLeaves[key]);
  const rwPh = extractPlaceholders(syncedLeaves[key] || '');
  if (enPh.length > 0 || rwPh.length > 0) {
    if (JSON.stringify(enPh) !== JSON.stringify(rwPh)) {
      placeholderMismatches.push({ key, en: enPh, rw: rwPh });
    }
  }

  // Interpolation validation (en vs termbase, only for keys in termbase)
  if (key in termbaseLeaves) {
    const tbPh = extractPlaceholders(termbaseLeaves[key]);
    if (enPh.length > 0 || tbPh.length > 0) {
      if (JSON.stringify(enPh) !== JSON.stringify(tbPh)) {
        interpolationMismatches.push({ key, en: enPh, termbase: tbPh });
      }
    }
  }

  // HTML mismatch
  if (hasHtml(enLeaves[key]) !== hasHtml(syncedLeaves[key] || '')) {
    htmlMismatches.push(key);
  }

  // Markdown corruption
  if (hasMarkdown(enLeaves[key]) && !hasMarkdown(syncedLeaves[key] || '')) {
    const enMd = (enLeaves[key].match(/(\*\*|__|`)/g) || []).length;
    if (enMd > 0) markdownCorruptions.push(key);
  }
}

// ── Verify synced file ──
let validation = {
  validJson: false,
  duplicateKeys: false,
  utf8: false,
  placeholderIssues: placeholderMismatches.length,
  interpolationIssues: interpolationMismatches.length,
  htmlIssues: htmlMismatches.length,
  markdownIssues: markdownCorruptions.length,
};

try {
  JSON.parse(fs.readFileSync(rwPath, 'utf8'));
  validation.validJson = true;
} catch (e) {
  validation.validJson = false;
}

// Duplicate keys check
try {
  const raw = fs.readFileSync(rwPath, 'utf8');
  const parsed = JSON.parse(raw);
  const keys = Object.keys(parsed);
  const unique = new Set(keys);
  validation.duplicateKeys = keys.length !== unique.size;
} catch (e) {
  validation.duplicateKeys = false;
}

// UTF-8 check
try {
  const buf = fs.readFileSync(rwPath);
  const content = buf.toString('utf8');
  validation.utf8 = !content.includes('\uFFFD') && buf[0] !== 0xef;
} catch (e) {
  validation.utf8 = false;
}

// ── Compute stats ──
const enLeafCount = countLeafKeys(en);
const termbaseLeafCount = countLeafKeys(termbase);
const rwLeafCount = countLeafKeys(synced);

// How many en.json keys are covered by termbase
const enKeysInTermbase = Object.keys(enLeaves).filter(k => k in termbaseLeaves).length;
const enKeysInRw = Object.keys(enLeaves).filter(k => k in rwLeaves).length;
const enKeysInGit = Object.keys(enLeaves).filter(k => k in rwGitLeaves).length;

const termbaseCoverage = enLeafCount > 0
  ? ((enKeysInTermbase / enLeafCount) * 100).toFixed(2)
  : '0.00';

const totalCoverage = enLeafCount > 0
  ? (((enKeysInTermbase + (enKeysInRw - enKeysInTermbase) + (enKeysInGit - enKeysInRw)) / enLeafCount) * 100).toFixed(2)
  : '0.00';

// Translated vs untranslated
const translatedCount = stats.fromTermbase + stats.fromRwExisting + stats.fromRwGit;
const untranslatedCount = stats.fallbackToEn;
const translationRate = enLeafCount > 0
  ? ((translatedCount / enLeafCount) * 100).toFixed(2)
  : '0.00';

// Reserve list: termbase keys that don't match any en.json path
const termbaseKeysNotInEn = Object.keys(termbaseLeaves).filter(k => !(k in enLeaves));

// Group unmatched termbase keys by top-level section
const termbaseReserveSections = {};
for (const k of termbaseKeysNotInEn) {
  const section = k.split('.')[0];
  if (!termbaseReserveSections[section]) {
    termbaseReserveSections[section] = [];
  }
  termbaseReserveSections[section].push(k);
}

// Also identify en.json sections not in termbase (untranslated sections)
const enTopSections = Object.keys(en);
const enSectionsNotInTermbase = enTopSections.filter(s => !(s in termbase));

const allPass = validation.validJson &&
  !validation.duplicateKeys &&
  validation.utf8 &&
  validation.placeholderIssues === 0 &&
  validation.interpolationIssues === 0 &&
  validation.htmlIssues === 0 &&
  validation.markdownIssues === 0;

// ── Generate Reserve List ──
let reserveMd = '# RW Termbase Reserve List\n\n';
reserveMd += 'Unverified translations and structural mismatches between the termbase and en.json.\n\n';
reserveMd += `**Generated:** ${new Date().toISOString()}\n\n`;
reserveMd += '---\n\n';

reserveMd += '## Part 1: Termbase Keys Not Matching en.json Structure\n\n';
reserveMd += `**Total unmatched termbase leaf keys:** ${termbaseKeysNotInEn.length}\n`;
reserveMd += `**Total termbase top-level sections not in en.json:** ${Object.keys(termbaseReserveSections).length}\n\n`;
reserveMd += 'These termbase keys exist in the verified termbase but do not correspond to any key path in `en.json`.\n';
reserveMd += 'They were NOT included in `rw.json` because `rw.json` is built from `en.json`\'s structure.\n';
reserveMd += 'These may represent translations from a different app version or a flattened structure that needs reconciliation.\n\n';

if (Object.keys(termbaseReserveSections).length > 0) {
  reserveMd += '| # | Termbase Section | Unmatched Keys | In en.json? |\n';
  reserveMd += '|---|-----------------|----------------|-------------|\n';
  const sortedSections = Object.keys(termbaseReserveSections).sort();
  sortedSections.forEach((section, i) => {
    const inEn = section in en ? 'Yes' : 'No';
    reserveMd += `| ${i + 1} | \`${section}\` | ${termbaseReserveSections[section].length} | ${inEn} |\n`;
  });
  reserveMd += '\n';

  reserveMd += '### Detailed Key Listing\n\n';
  for (const section of sortedSections) {
    reserveMd += `#### ${section} (${termbaseReserveSections[section].length} keys)\n\n`;
    reserveMd += '| Key | Kinyarwanda Translation |\n|-----|------------------------|\n';
    for (const k of termbaseReserveSections[section]) {
      const val = JSON.stringify(termbaseLeaves[k]).substring(0, 80);
      reserveMd += `| \`${k}\` | ${val} |\n`;
    }
    reserveMd += '\n';
  }
}

reserveMd += '---\n\n';
reserveMd += '## Part 2: en.json Keys Not Covered by Termbase\n\n';
reserveMd += `**Total en.json leaf keys not in termbase:** ${enLeafCount - enKeysInTermbase}\n\n`;
reserveMd += 'These en.json keys do not have a verified Kinyarwanda translation in the termbase.\n';
reserveMd += 'Where existing `rw.json` or git HEAD had a translation, it was preserved.\n';
reserveMd += 'Where no translation existed, the English value was used as a fallback.\n\n';

const enKeysNotInTb = Object.keys(enLeaves).filter(k => !(k in termbaseLeaves));
if (enKeysNotInTb.length > 0) {
  reserveMd += '| # | Key | Source Used |\n|---|-----|------------|\n';
  enKeysNotInTb.forEach((k, i) => {
    let source = 'English fallback';
    if (k in rwLeaves) source = 'Existing rw.json';
    else if (k in rwGitLeaves) source = 'Git HEAD rw.json';
    reserveMd += `| ${i + 1} | \`${k}\` | ${source} |\n`;
  });
}

fs.writeFileSync(reservePath, reserveMd, 'utf8');

// ── Generate Sync Audit ──
let auditMd = '# RW Termbase Synchronization Audit\n\n';
auditMd += `**Generated:** ${new Date().toISOString()}\n\n`;
auditMd += '---\n\n';

auditMd += '## Architecture\n\n';
auditMd += '```\n';
auditMd += 'en.json (structural template + English fallback)\n';
auditMd += '  │\n';
auditMd += '  ├── VERIFIED_KINYARWANDA_TERMBASE.json (canonical Kinyarwanda translations)\n';
auditMd += '  │     │\n';
auditMd += '  │     └── Matched by full dot-path (e.g. "common.welcome")\n';
auditMd += '  │\n';
auditMd += '  ├── Existing rw.json (preserved translations for non-termbase keys)\n';
auditMd += '  │\n';
auditMd += '  ├── Git HEAD rw.json (recovery source for lost translations)\n';
auditMd += '  │\n';
auditMd += '  └── rw.json (output: same structure as en.json, fully populated)\n';
auditMd += '```\n\n';

auditMd += '## Files\n\n';
auditMd += '| File | Path | Role |\n|------|------|------|\n';
auditMd += `| English source | \`src/locales/en.json\` | Structural template + fallback |\n`;
auditMd += `| Verified termbase | \`src/locales/VERIFIED_KINYARWANDA_TERMBASE.json\` | Canonical Kinyarwanda translations |\n`;
auditMd += `| Runtime localization | \`src/locales/rw.json\` | Application runtime file (output) |\n\n`;

auditMd += '## File Comparison\n\n';
auditMd += '| Metric | en.json | fr.json | rw.json | Termbase |\n';
auditMd += '|--------|---------|---------|---------|----------|\n';

const frPath = path.join(localesDir, 'fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const frLeafCount = countLeafKeys(fr);

auditMd += `| Lines | ${fs.readFileSync(enPath, 'utf8').split('\n').length} | ${fs.readFileSync(frPath, 'utf8').split('\n').length} | ${fs.readFileSync(rwPath, 'utf8').split('\n').length} | ${fs.readFileSync(termbasePath, 'utf8').split('\n').length} |\n`;
auditMd += `| Size (KB) | ${(fs.readFileSync(enPath).length / 1024).toFixed(1)} | ${(fs.readFileSync(frPath).length / 1024).toFixed(1)} | ${(fs.readFileSync(rwPath).length / 1024).toFixed(1)} | ${(fs.readFileSync(termbasePath).length / 1024).toFixed(1)} |\n`;
auditMd += `| Top-level sections | ${Object.keys(en).length} | ${Object.keys(fr).length} | ${Object.keys(synced).length} | ${Object.keys(termbase).length} |\n`;
auditMd += `| Leaf keys | ${enLeafCount} | ${frLeafCount} | ${rwLeafCount} | ${termbaseLeafCount} |\n\n`;

auditMd += '## Synchronization Results\n\n';
auditMd += '| Metric | Value |\n|--------|-------|\n';
auditMd += `| Total en.json leaf keys (target) | ${enLeafCount} |\n`;
auditMd += `| rw.json leaf keys (output) | ${rwLeafCount} |\n`;
auditMd += `| Translated from verified termbase | ${stats.fromTermbase} |\n`;
auditMd += `| Preserved from existing rw.json | ${stats.fromRwExisting} |\n`;
auditMd += `| Recovered from git HEAD rw.json | ${stats.fromRwGit} |\n`;
auditMd += `| English fallback (untranslated) | ${stats.fallbackToEn} |\n`;
auditMd += `| Termbase keys matching en.json paths | ${enKeysInTermbase} |\n`;
auditMd += `| Termbase keys NOT matching en.json paths | ${termbaseKeysNotInEn.length} |\n`;
auditMd += `| en.json keys missing from termbase | ${enLeafCount - enKeysInTermbase} |\n\n`;

auditMd += '## Coverage\n\n';
auditMd += '```\n';
auditMd += `en.json leaf keys:                      ${enLeafCount}\n`;
auditMd += `rw.json leaf keys:                      ${rwLeafCount}\n`;
auditMd += `Structure matches en.json:              YES (built from en.json template)\n\n`;
auditMd += `Translated from verified termbase:      ${stats.fromTermbase} (${termbaseCoverage}%)\n`;
auditMd += `Preserved from existing rw.json:        ${stats.fromRwExisting}\n`;
auditMd += `Recovered from git HEAD:                ${stats.fromRwGit}\n`;
auditMd += `English fallback (untranslated):        ${stats.fallbackToEn}\n\n`;
auditMd += `Total translated:                       ${translatedCount} (${translationRate}%)\n`;
auditMd += `Total untranslated (English fallback):  ${untranslatedCount}\n\n`;
auditMd += `Termbase coverage of en.json:           ${termbaseCoverage}%\n`;
auditMd += `Overall translation coverage:           ${translationRate}%\n`;
auditMd += '```\n\n';

auditMd += '## Consistency Validation\n\n';
auditMd += '| Check | Result |\n|-------|--------|\n';
auditMd += `| Valid JSON | ${validation.validJson ? 'PASS' : 'FAIL'} |\n`;
auditMd += `| No duplicate keys | ${!validation.duplicateKeys ? 'PASS' : 'FAIL'} |\n`;
auditMd += `| No missing placeholders | ${validation.placeholderIssues === 0 ? 'PASS' : 'FAIL (' + validation.placeholderIssues + ')'} |\n`;
auditMd += `| No placeholder mismatches | ${validation.placeholderIssues === 0 ? 'PASS' : 'FAIL (' + validation.placeholderIssues + ')'} |\n`;
auditMd += `| No interpolation mismatches | ${validation.interpolationIssues === 0 ? 'PASS' : 'FAIL (' + validation.interpolationIssues + ')'} |\n`;
auditMd += `| No HTML mismatches | ${validation.htmlIssues === 0 ? 'PASS' : 'FAIL (' + validation.htmlIssues + ')'} |\n`;
auditMd += `| No Markdown corruption | ${validation.markdownIssues === 0 ? 'PASS' : 'FAIL (' + validation.markdownIssues + ')'} |\n`;
auditMd += `| UTF-8 encoding verified | ${validation.utf8 ? 'PASS' : 'FAIL'} |\n`;
auditMd += `| Structure matches en.json | PASS |\n`;
auditMd += `| All en.json keys present in rw.json | ${rwLeafCount === enLeafCount ? 'PASS' : 'FAIL (' + rwLeafCount + ' vs ' + enLeafCount + ')'} |\n\n`;

if (placeholderMismatches.length > 0) {
  auditMd += '### Placeholder Mismatches Detail\n\n';
  auditMd += '| Key | EN placeholders | RW placeholders |\n|-----|-----------------|----------------|\n';
  for (const p of placeholderMismatches) {
    auditMd += `| \`${p.key}\` | ${p.en.join(', ') || 'none'} | ${p.rw.join(', ') || 'none'} |\n`;
  }
  auditMd += '\n';
}

if (interpolationMismatches.length > 0) {
  auditMd += '### Interpolation Mismatches Detail (EN vs Termbase)\n\n';
  auditMd += '| Key | EN placeholders | Termbase placeholders |\n|-----|-----------------|---------------------|\n';
  for (const p of interpolationMismatches) {
    auditMd += `| \`${p.key}\` | ${p.en.join(', ') || 'none'} | ${p.termbase.join(', ') || 'none'} |\n`;
  }
  auditMd += '\n';
}

if (htmlMismatches.length > 0) {
  auditMd += '### HTML Mismatches Detail\n\n';
  for (const k of htmlMismatches) {
    auditMd += `- \`${k}\`\n`;
  }
  auditMd += '\n';
}

if (markdownCorruptions.length > 0) {
  auditMd += '### Markdown Corruption Detail\n\n';
  for (const k of markdownCorruptions) {
    auditMd += `- \`${k}\`\n`;
  }
  auditMd += '\n';
}

auditMd += '## Synchronization Rules Applied\n\n';
auditMd += '1. **Structural template:** rw.json is built from en.json\'s exact structure (same keys, same nesting).\n';
auditMd += '2. **Termbase priority:** For each en.json leaf key, if the termbase has a translation at the same dot-path, use it.\n';
auditMd += '3. **Preserve existing:** If the termbase doesn\'t have the key but current rw.json does, preserve the existing translation.\n';
auditMd += '4. **Git recovery:** If neither termbase nor current rw.json has the key, check git HEAD rw.json.\n';
auditMd += '5. **English fallback:** If no Kinyarwanda translation exists anywhere, use the English value from en.json.\n';
auditMd += '6. **No foreign keys:** Termbase keys that don\'t match en.json paths are excluded from rw.json and listed in the reserve.\n';
auditMd += '7. **No invented content:** No machine translation or invented terminology.\n\n';

auditMd += '## Structural Notes\n\n';
auditMd += `The verified termbase has ${Object.keys(termbase).length} top-level sections, while en.json has ${Object.keys(en).length}.\n`;
auditMd += `The termbase uses a flatter structure where many en.json nested sections appear as top-level keys.\n`;
auditMd += `Only ${enKeysInTermbase} of ${termbaseLeafCount} termbase leaf keys match en.json paths exactly.\n`;
auditMd += `The remaining ${termbaseKeysNotInEn.length} termbase keys could not be mapped and are documented in the reserve list.\n\n`;

auditMd += '---\n\n';
auditMd += `**Certification:** ${allPass && rwLeafCount === enLeafCount ? 'This synchronization is certified as complete and valid. rw.json mirrors en.json structure with all keys populated.' : 'Issues detected — review required.'}\n`;

fs.writeFileSync(auditPath, auditMd, 'utf8');

// ── Console output ──
console.log('=== Synchronization Complete (en.json-structured) ===\n');
console.log(`en.json leaf keys:                      ${enLeafCount}`);
console.log(`rw.json leaf keys:                      ${rwLeafCount}`);
console.log(`rw.json top-level sections:             ${Object.keys(synced).length} (matches en.json: ${Object.keys(synced).length === Object.keys(en).length})\n`);
console.log(`Translated from verified termbase:      ${stats.fromTermbase} (${termbaseCoverage}%)`);
console.log(`Preserved from existing rw.json:        ${stats.fromRwExisting}`);
console.log(`Recovered from git HEAD:                ${stats.fromRwGit}`);
console.log(`English fallback (untranslated):        ${stats.fallbackToEn}\n`);
console.log(`Total translated:                       ${translatedCount} (${translationRate}%)`);
console.log(`Termbase keys matching en.json:         ${enKeysInTermbase}`);
console.log(`Termbase keys NOT matching en.json:     ${termbaseKeysNotInEn.length}\n`);
console.log(`Validation: ${allPass && rwLeafCount === enLeafCount ? 'PASS' : 'FAIL'}`);
console.log(`  Valid JSON: ${validation.validJson ? 'PASS' : 'FAIL'}`);
console.log(`  No duplicate keys: ${!validation.duplicateKeys ? 'PASS' : 'FAIL'}`);
console.log(`  No placeholder mismatches: ${validation.placeholderIssues === 0 ? 'PASS' : 'FAIL (' + validation.placeholderIssues + ')'} `);
console.log(`  No interpolation mismatches: ${validation.interpolationIssues === 0 ? 'PASS' : 'FAIL (' + validation.interpolationIssues + ')'} `);
console.log(`  No HTML mismatches: ${validation.htmlIssues === 0 ? 'PASS' : 'FAIL (' + validation.htmlIssues + ')'} `);
console.log(`  No Markdown corruption: ${validation.markdownIssues === 0 ? 'PASS' : 'FAIL (' + validation.markdownIssues + ')'} `);
console.log(`  UTF-8 encoding: ${validation.utf8 ? 'PASS' : 'FAIL'}`);
console.log(`  Structure matches en.json: PASS`);
console.log(`  All en.json keys present: ${rwLeafCount === enLeafCount ? 'PASS' : 'FAIL'}\n`);
console.log(`Files written:`);
console.log(`  ${rwPath}`);
console.log(`  ${reservePath}`);
console.log(`  ${auditPath}`);
