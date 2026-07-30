const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'locales', 'VERIFIED_KINYARWANDA_TERMBASE.json');
let raw = fs.readFileSync(filePath, 'utf8');

// Remove blank lines and normalize
raw = raw.replace(/\r\n/g, '\n');

// Step 1: Remove the premature closing brace after "common" block (line ~26)
// Pattern: `},\n\n}` followed by a new key — this closes the root object too early
// We need to find `}` that closes the root prematurely and remove it
// The structure is: { "common": {...}, } then standalone "key": {...} blocks

// Strategy: Remove all top-level closing braces that appear between sections
// and wrap everything properly

// Remove all standalone blank lines
let lines = raw.split('\n').filter(l => l.trim() !== '');

// Join into a single string for processing
let content = lines.join('\n');

// The file starts with { and has multiple } followed by "key": sections
// We need to: remove premature } closures, ensure commas between sections,
// and add final } 

// Step 1: Remove the initial { since we'll re-add it
content = content.trim();
if (content.startsWith('{')) {
  content = content.substring(1).trim();
}

// Step 2: Find and remove premature closing braces
// A premature closing brace is a } that appears at the start of a line
// followed by a new "key": section (not inside a nested object)
// We'll use a brace-counting approach

let result = '';
let depth = 0;
let i = 0;
let firstKeyHandled = false;

// Skip the "common": { ... } block which is already properly structured
// Actually, let's just process character by character

// Reset - work with the original content but fix the structure
content = lines.join('\n');

// Remove the first { (root open)
content = content.replace(/^\s*\{/, '');

// Now find all premature root-level closing braces
// These are } that appear when depth would go negative
let fixed = '';
depth = 0;
let prevChar = '';
let inString = false;
let escapeNext = false;

for (i = 0; i < content.length; i++) {
  const ch = content[i];
  
  if (escapeNext) {
    fixed += ch;
    escapeNext = false;
    continue;
  }
  
  if (ch === '\\' && inString) {
    fixed += ch;
    escapeNext = true;
    continue;
  }
  
  if (ch === '"') {
    inString = !inString;
    fixed += ch;
    continue;
  }
  
  if (inString) {
    fixed += ch;
    continue;
  }
  
  if (ch === '{') {
    depth++;
    fixed += ch;
    continue;
  }
  
  if (ch === '}') {
    if (depth > 0) {
      depth--;
      fixed += ch;
    }
    // If depth would go negative, skip this } (it's a premature root close)
    continue;
  }
  
  fixed += ch;
}

// Now we have content without premature closing braces
// We need to ensure commas between sections
// Pattern: `}` or `"` followed by newline and then `"key":` without comma

// Add comma after } that is followed by " (new key)
fixed = fixed.replace(/\}(\s*)\n(\s*)"/g, '},\n$2"');

// Add comma after "value" that is followed by newline and then "key": without comma
// This handles cases like: "value"\n"key":
fixed = fixed.replace(/"(\s*)\n(\s*)"/g, '",\n$2"');

// Also handle } followed by } (nested close then new section)
// Already handled above

// Wrap in root object
fixed = '{\n' + fixed + '\n}';

// Step 3: Parse to validate and handle duplicate keys
// We need a custom parser that merges duplicates
function parseWithMerge(text) {
  // First try normal parse
  try {
    return JSON.parse(text);
  } catch(e) {
    // If it fails, we need more aggressive fixing
    console.error('Initial parse failed:', e.message);
    return null;
  }
}

let parsed = parseWithMerge(fixed);

if (!parsed) {
  // Try more aggressive comma fixing
  // Fix missing commas between } and " on same or next line
  fixed = fixed.replace(/\}(\s*)\{/g, '},\n{');
  // Fix missing commas between " and " across lines (value followed by key)
  // Already done above but try again
  fixed = fixed.replace(/(?<!,)\n(\s*)"/g, function(match, indent, offset, str) {
    // Check if previous non-whitespace char is } or " or , or {
    let i = offset - 1;
    while (i >= 0 && /\s/.test(str[i])) i--;
    if (str[i] === ',' || str[i] === '{') return match;
    return ',' + match;
  });
  
  parsed = parseWithMerge(fixed);
}

if (!parsed) {
  // Last resort: try to find and fix specific issues
  console.log('Attempting line-by-line fix...');
  
  // Rebuild from lines with proper comma insertion
  let rebuilt = '{\n';
  let lineArr = fixed.replace(/^\{\n/, '').replace(/\n\}$/, '').split('\n');
  let rDepth = 0;
  let inStr = false;
  let esc = false;
  
  for (let li = 0; li < lineArr.length; li++) {
    let line = lineArr[li].trimEnd();
    if (line.trim() === '') continue;
    rebuilt += line + '\n';
  }
  
  // This approach is getting complex, let's try another strategy
  // Use eval with relaxed parsing
  try {
    // Remove trailing commas
    let clean = fixed.replace(/,\s*([}\]])/g, '$1');
    parsed = JSON.parse(clean);
  } catch(e2) {
    console.error('All parse attempts failed:', e2.message);
    console.log('Writing fixed file for manual inspection...');
  }
}

if (parsed) {
  // Write the fixed JSON
  const output = JSON.stringify(parsed, null, 2);
  fs.writeFileSync(filePath, output, 'utf8');
  console.log('SUCCESS: Fixed JSON written to', filePath);
  console.log('Top-level keys:', Object.keys(parsed).length);
  console.log('Keys:', Object.keys(parsed).join(', '));
} else {
  // Write the best-effort fixed version for inspection
  fs.writeFileSync(filePath + '.fixed', fixed, 'utf8');
  console.log('Wrote best-effort to', filePath + '.fixed');
}
