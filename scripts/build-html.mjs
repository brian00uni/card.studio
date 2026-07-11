import fs from 'node:fs';
import path from 'node:path';
import { renderCards } from '../templates/card-templates.mjs';

const input = process.argv[2];
const outArg = process.argv[3];
if (!input) {
  console.error('사용법: node scripts/build-html.mjs data/cities/file.json [output-dir]');
  process.exit(2);
}
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const date = new Date().toISOString().slice(0,10);
const outDir = outArg || path.join('output', `${date}_${data.meta.city}`);
fs.mkdirSync(outDir, { recursive: true });
const cards = renderCards(data);
const names = [
  'card-01-cover.html','card-02-korean-phone.html','card-03-hospital.html',
  'card-04-community.html','card-05-show-screen.html','card-06-medicine.html','card-07-summary.html'
];
cards.forEach((html, i) => fs.writeFileSync(path.join(outDir, names[i]), html));
fs.copyFileSync(input, path.join(outDir, 'card-data.json'));
if (!fs.existsSync(path.join(outDir, 'sources.md'))) fs.writeFileSync(path.join(outDir, 'sources.md'), '# 출처\n\nCodex가 공식 출처와 확인 날짜를 기록합니다.\n');
if (!fs.existsSync(path.join(outDir, 'qa-report.md'))) fs.writeFileSync(path.join(outDir, 'qa-report.md'), '# QA 보고서\n\n- [ ] 전화번호 검증\n- [ ] 현지어 검수\n- [ ] 병원 운영정보 검증\n- [ ] 약품 실사 확인\n- [ ] @gaseongbi_crew 확인\n- [ ] overflow 확인\n');
if (!fs.existsSync(path.join(outDir, 'caption.txt'))) fs.writeFileSync(path.join(outDir, 'caption.txt'), '캡션 작성 필요\n');
if (!fs.existsSync(path.join(outDir, 'text-version.txt'))) fs.writeFileSync(path.join(outDir, 'text-version.txt'), '텍스트 정리본 작성 필요\n');
console.log(`HTML 7장 생성: ${outDir}`);
