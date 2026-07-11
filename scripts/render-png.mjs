import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';

const outDir = process.argv[2];
if (!outDir) {
  console.error('사용법: node scripts/render-png.mjs output/날짜_도시');
  process.exit(2);
}
const fontPath = path.resolve('assets/fonts/PretendardVariable.woff2');
if (!fs.existsSync(fontPath)) {
  console.error('PretendardVariable.woff2가 없습니다. HTML은 유지하고 PNG 렌더링을 중단합니다.');
  process.exit(1);
}
const files = fs.readdirSync(outDir).filter(f => /^card-\d{2}-.+\.html$/.test(f)).sort();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
for (const file of files) {
  const url = pathToFileURL(path.resolve(outDir, file)).href;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth > 1080,
    y: document.documentElement.scrollHeight > 1920
  }));
  if (overflow.x || overflow.y) throw new Error(`${file}: overflow 감지 ${JSON.stringify(overflow)}`);
  await page.screenshot({ path: path.join(outDir, file.replace('.html','.png')), fullPage: false });
}
await browser.close();
console.log(`PNG ${files.length}장 생성 완료`);
