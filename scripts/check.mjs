import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
for (const page of ['index.html','resume.html']) {
  const html = await readFile(path.join(root,page),'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size,`${page}: duplicate IDs`);
  for (const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (url === '#') continue;
    if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)),`${page}: broken anchor ${url}`);
    else if (url.startsWith('./')) await access(path.resolve(root,url));
    else assert.ok(/^(https:\/\/|mailto:)/.test(url),`${page}: unexpected URL ${url}`);
  }
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${page}: expected one h1`);
  assert.ok(html.includes('lang="zh-CN"'));
  assert.ok(!/1[3-9]\d{9}|待填写|Lorem ipsum/.test(html),`${page}: unexpected private or placeholder text`);
  console.log(`${page}: local links, anchors, heading, language and content checks passed`);
}
