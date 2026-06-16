const fs = require('fs');
const path = require('path');

function main() {
  const f = path.resolve(process.cwd(), 'ts-errors.txt');
  if (!fs.existsSync(f)) {
    console.error('ts-errors.txt not found');
    process.exit(1);
  }
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const errs = [];
  for (const l of lines) {
    if (!l.startsWith('src/')) continue;
    const idx = l.indexOf('(');
    if (idx === -1) continue;
    const file = l.slice(0, idx);
    const msg = l;
    let cat = '';
    if (/Cannot find module|corresponding type declarations/.test(msg)) cat = 'third_party';
    else if (/WhereInput|Select<DefaultArgs>|Enum[A-Za-z]+|InputJson|Unchecked|Without<|OrderBy|GroupBy|NestedEnum|PrismaClient/.test(msg)) cat = 'prisma';
    else if (file.startsWith('src/components/')) cat = 'ui_components';
    else if (file.startsWith('src/pages/api/')) cat = 'api_routes';
    else if (file.startsWith('src/pages/')) cat = 'next_pages';
    else if (file.startsWith('src/lib/services/')) cat = 'services';
    else cat = 'other';
    errs.push({ file, cat });
  }
  const byCatMap = {};
  for (const e of errs) byCatMap[e.cat] = (byCatMap[e.cat] || 0) + 1;
  const byCategory = Object.entries(byCatMap).map(([category, count]) => ({ category, count }));
  const fileCounts = Object.entries(errs.reduce((a, e) => (a[e.file] = (a[e.file] || 0) + 1, a), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([file, count]) => ({ file, count }));
  const out = { total: errs.length, byCategory, topFiles: fileCounts };
  console.log(JSON.stringify(out, null, 2));
}

main();
