const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'locales', 'VERIFIED_KINYARWANDA_TERMBASE.json');
let raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Step 1: Remove the premature root closing brace after "common" block
// Pattern: },\n\n} — the standalone } that closes root too early
let content = raw.replace(/\},\s*\n\s*\}\s*\n/, '},\n');

// Step 2: Add missing commas using regex on the full content
// Case A: } followed by whitespace/newline then " (new key without comma)
content = content.replace(/\}(\s*\n\s*)"(\w)/g, '},\n$2"$3');

// Case B: " (end of string value) followed by whitespace/newline then " (new key)
// But NOT when the first " is preceded by : (which means it's a key, not a value)
// Match: " (not preceded by : or ,) followed by whitespace/newline then "
content = content.replace(/(?<![:,\s])"(\s*\n\s*)"(\w)/g, '",$1"$2');

// Step 3: Ensure the content ends with }
content = content.trimEnd();
if (!content.endsWith('}')) {
  content += '\n}';
}

// Step 4: Parse
let parsed;
try {
  parsed = JSON.parse(content);
  console.log('SUCCESS: Parsed with JSON.parse');
} catch(e) {
  console.error('JSON.parse failed:', e.message);
  
  // Show context around error
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    // Find line number
    const before = content.substring(0, pos);
    const lineNum = before.split('\n').length;
    const context = content.substring(Math.max(0, pos - 300), pos + 300);
    console.log('Error at line', lineNum);
    console.log('Context:');
    console.log(context);
  }
  
  fs.writeFileSync(filePath + '.attempt', content, 'utf8');
  console.log('Wrote attempt to', filePath + '.attempt');
  process.exit(1);
}

// Write fixed JSON
const output = JSON.stringify(parsed, null, 2);
fs.writeFileSync(filePath, output, 'utf8');
console.log('Fixed JSON written to', filePath);
console.log('Top-level keys:', Object.keys(parsed).length);
console.log('Keys:', Object.keys(parsed).join(', '));

// Clean up temp files
try { fs.unlinkSync(filePath + '.fixed'); } catch(e) {}
try { fs.unlinkSync(filePath + '.attempt'); } catch(e) {}
