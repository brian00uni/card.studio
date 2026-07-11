import fs from 'node:fs';

const input = process.argv[2];
if (!input) {
  console.error('사용법: node scripts/validate-data.mjs data/cities/file.json');
  process.exit(2);
}
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const errors = [];
const required = [
  ['meta.country', data.meta?.country], ['meta.city', data.meta?.city], ['meta.account', data.meta?.account],
  ['cover.city', data.cover?.city], ['phones.primaryNumber', data.phones?.primaryNumber],
  ['hospitals.items', data.hospitals?.items?.length], ['community.communityName', data.community?.communityName],
  ['phrases.groups', data.phrases?.groups?.length], ['medicines.items', data.medicines?.items?.length],
  ['summary.rows', data.summary?.rows?.length]
];
for (const [name, value] of required) if (!value) errors.push(`필수값 누락: ${name}`);
if (data.meta?.account !== '@gaseongbi_crew') errors.push('계정명은 @gaseongbi_crew만 허용');
if ((data.hospitals?.items?.length || 0) > 3) errors.push('병원은 카드 가독성을 위해 최대 3곳');
if ((data.medicines?.items?.length || 0) !== 4) errors.push('약품 카드는 4개 분류를 사용');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('기본 데이터 검증 통과');
