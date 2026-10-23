import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const BASE = 'https://jazzy-begonia-580c72.netlify.app/';
const OUT = 'dilxush';
const seen = new Set();
const queue = ['index.html', 'site.webmanifest'];

async function get(path) {
  const res = await fetch(new URL(path, BASE));
  if (!res.ok) { console.log('✗', path, res.status); return null; }
  const buf = Buffer.from(await res.arrayBuffer());
  const file = join(OUT, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, buf);
  console.log('✓', path);
  return buf;
}

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const buf = await get(path);
  if (!buf || !/\.(html|css|js|webmanifest)$/.test(path)) continue;
  const text = buf.toString('utf8');

  // html / js ichidagi assets/... yo'llari
  for (const m of text.matchAll(/assets\/[\w./-]+\.\w+/g)) queue.push(m[0]);

  // css ichidagi url(...) — css fayl joyiga nisbatan
  if (path.endsWith('.css')) {
    for (const m of text.matchAll(/url\(\s*['"]?([^)'"#?]+)/g)) {
      if (/^(data:|https?:)/.test(m[1])) continue;
      const abs = new URL(m[1], new URL(path, BASE));
      queue.push(abs.pathname.replace(/^\//, ''));
    }
  }
}
console.log('\nTayyor: ./' + OUT);