const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'locales', 'VERIFIED_KINYARWANDA_TERMBASE.json');
let raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// The file is a series of root-level JSON fragments:
//   { "common": {...} }  "features_finance": {...}  "marketplace": {...}  ...
// We need to:
// 1. Keep the initial { (root open)
// 2. Skip all } that bring depth to 0 (root closes between fragments)
// 3. Insert commas when a new key starts at depth 0 (between fragments)
// 4. Add final } at the end

let output = '';
let depth = 0;
let inString = false;
let escapeNext = false;
let lastNonWsChar = '';
let lastNonWsIdx = -1;
let skippedFirstRootClose = false;

function maybeInsertComma(ch) {
  // Insert comma if needed between items
  if (depth >= 1 && (lastNonWsChar === '}' || lastNonWsChar === '"')) {
    if (ch === '"' || ch === '{') {
      output = output.substring(0, lastNonWsIdx + 1) + ',' + output.substring(lastNonWsIdx + 1);
      lastNonWsIdx++;
    }
  }
  // At depth 0 (between fragments), insert comma if last was } or " and this is "
  if (depth === 0 && (lastNonWsChar === '}' || lastNonWsChar === '"')) {
    if (ch === '"') {
      output = output.substring(0, lastNonWsIdx + 1) + ',' + output.substring(lastNonWsIdx + 1);
      lastNonWsIdx++;
    }
  }
}

for (let i = 0; i < raw.length; i++) {
  const ch = raw[i];

  if (escapeNext) {
    output += ch;
    escapeNext = false;
    continue;
  }

  if (ch === '\\' && inString) {
    output += ch;
    escapeNext = true;
    continue;
  }

  // Check for comma insertion BEFORE handling string delimiters
  // This ensures that when a new " starts a key, we insert comma first
  if (!inString && !/\s/.test(ch)) {
    maybeInsertComma(ch);
  }

  if (ch === '"') {
    inString = !inString;
    output += ch;
    lastNonWsChar = '"';
    lastNonWsIdx = output.length - 1;
    continue;
  }

  if (inString) {
    output += ch;
    continue;
  }

  if (ch === '{') {
    depth++;
    output += ch;
    lastNonWsChar = '{';
    lastNonWsIdx = output.length - 1;
    continue;
  }

  if (ch === '}') {
    if (depth > 1) {
      depth--;
      output += ch;
      lastNonWsChar = '}';
      lastNonWsIdx = output.length - 1;
    } else if (depth === 1) {
      depth--;
      if (!skippedFirstRootClose) {
        // First } at depth 1→0 is the premature root close — skip it
        skippedFirstRootClose = true;
      } else {
        // Subsequent } at depth 1→0 are fragment closes — write them
        output += ch;
        lastNonWsChar = '}';
        lastNonWsIdx = output.length - 1;
      }
    }
    continue;
  }

  if (/\s/.test(ch)) {
    output += ch;
    continue;
  }

  output += ch;
  lastNonWsChar = ch;
  lastNonWsIdx = output.length - 1;
}

// Close root object (the initial { was kept, its matching } was skipped)
if (depth === 0) {
  output += '\n}';
}

// Parse
let parsed;
try {
  parsed = JSON.parse(output);
  console.log('SUCCESS: JSON parsed');
} catch(e) {
  console.error('Parse failed:', e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const before = output.substring(0, pos);
    const lineNum = before.split('\n').length;
    const context = output.substring(Math.max(0, pos - 300), pos + 300);
    console.log('Error at line', lineNum);
    console.log('Context:');
    console.log(context);
  }
  fs.writeFileSync(filePath + '.attempt', output, 'utf8');
  console.log('Wrote attempt to', filePath + '.attempt');
  process.exit(1);
}

// Write fixed JSON
const json = JSON.stringify(parsed, null, 2);
fs.writeFileSync(filePath, json, 'utf8');
console.log('Fixed JSON written to', filePath);
console.log('Top-level keys:', Object.keys(parsed).length);
console.log('Keys:', Object.keys(parsed).join(', '));

// Clean up temp files
try { fs.unlinkSync(filePath + '.fixed'); } catch(e) {}
try { fs.unlinkSync(filePath + '.attempt'); } catch(e) {}
