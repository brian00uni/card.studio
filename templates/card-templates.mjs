import fs from 'node:fs';
import path from 'node:path';

const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = (body, title) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=1080, initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="../../templates/shared.css"></head><body>${body}</body></html>`;
const shell = (inner, page, account) => `<main class="card"><div class="account">${esc(account || '@gaseongbi_crew')}</div>${inner}<div class="page">${page}/7</div></main>`;
const imageOrPlaceholder = (src, alt) => src ? `<img class="medicine-img" src="${esc(src)}" alt="${esc(alt)}">` : `<div class="medicine-placeholder">실제 제품 정면 사진 필요<br>AI 패키지 생성 금지</div>`;

export function renderCards(data) {
  const a = data.meta?.account || '@gaseongbi_crew';
  const cards = [];

  cards.push(base(shell(`
    <div class="kicker-line"></div>
    <div class="section-label">${esc(data.cover.eyebrow)}</div>
    <h1 class="title xl" style="margin-top:45px">${esc(data.cover.city)}</h1>
    <div style="margin-top:110px"><div class="subtitle">${esc(data.cover.headline)}</div><div class="body" style="margin-top:28px">${esc(data.cover.subline)}</div></div>
    <div class="footer"><div class="save-box">${esc(data.cover.saveLine)}</div></div>
  `, 1, a), `${data.meta.city} 표지`));

  const secondary = data.phones.secondary.map(x => `<div style="margin-top:30px"><div class="section-label" style="font-size:32px">${esc(x.label)}</div><div class="body" style="margin-top:8px">${esc(x.number)}</div></div>`).join('');
  cards.push(base(shell(`
    <div class="kicker-line"></div>
    <h1 class="title">${esc(data.phones.title)}</h1>
    <div class="rule"></div>
    <div class="section-label">${esc(data.phones.primaryLabel)}</div>
    <div class="number" style="margin-top:28px">${esc(data.phones.primaryNumber)}</div>
    <div class="rule"></div>
    ${secondary}
    <div class="info-box grid-2" style="margin-top:48px;text-align:center">
      <div><div class="section-label">구급차</div><div class="number" style="margin-top:18px">${esc(data.phones.ambulance)}</div></div>
      <div style="border-left:1px solid var(--line)"><div class="section-label">경찰</div><div class="number" style="margin-top:18px">${esc(data.phones.police)}</div></div>
    </div>
    <div class="footer">${esc(data.phones.footer)}</div>
  `, 2, a), `${data.meta.city} 긴급전화`));

  const hospitals = data.hospitals.items.map((h,i)=>`<div class="info-box"><div class="row"><span class="badge">${i+1}</span><div><div class="section-label">${esc(h.name)}</div><div class="body" style="margin-top:12px">${esc(h.language)}</div><div class="number" style="font-size:55px;margin-top:16px">${esc(h.phone)}</div><div class="body compact" style="margin-top:14px">${esc(h.note)}</div></div></div></div>`).join('');
  cards.push(base(shell(`
    <div class="kicker-line"></div>
    <div class="section-label">한국어 또는 영어 지원</div>
    <h1 class="title" style="margin-top:26px">${esc(data.hospitals.title.replace('한국어 또는 영어 지원 ',''))}</h1>
    <div style="margin-top:48px">${hospitals}</div>
    <div class="info-box" style="margin-top:24px"><div class="section-label red">${esc(data.hospitals.emergency)}</div></div>
    <div class="footer">${esc(data.hospitals.footer)}</div>
  `, 3, a), `${data.meta.city} 병원`));

  cards.push(base(shell(`
    <div class="kicker-line"></div>
    <h1 class="title">${esc(data.community.title)}</h1>
    <div style="margin-top:72px"><div class="row"><span class="badge">1</span><div><div class="section-label">공식 한인기관</div><div class="body" style="margin-top:26px;font-weight:750">${esc(data.community.official.name)}</div><div class="number" style="font-size:62px;margin-top:18px">${esc(data.community.official.phone)}</div><div class="body compact" style="margin-top:12px">${esc(data.community.official.note)}</div></div></div></div>
    <div class="hairline"></div>
    <div class="row"><span class="badge">2</span><div><div class="section-label">대표 카페</div><div class="title" style="font-size:102px;margin-top:24px">${esc(data.community.communityName)}</div><div class="body" style="margin-top:18px">${esc(data.community.communityNote)}</div></div></div>
    <div class="info-box" style="margin-top:46px"><ul class="list body">${data.community.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>
    <div class="footer">${esc(data.community.footer)}</div>
  `, 4, a), `${data.meta.city} 커뮤니티`));

  const groups = data.phrases.groups.map((g,i)=>`<div class="info-box"><div class="row"><span class="badge">${i+1}</span><div style="width:100%"><div class="section-label">${esc(g.target)}</div>${g.lines.map(l=>`<div class="hairline"></div><div class="phrase">${esc(l.local)}</div><div class="translation">${esc(l.ko)}</div>`).join('')}</div></div></div>`).join('');
  cards.push(base(shell(`
    <div class="kicker-line"></div>
    <h1 class="title">${esc(data.phrases.title)}</h1>
    <div class="subtitle">${esc(data.phrases.subtitle)}</div>
    <div style="margin-top:42px">${groups}</div>
    <div class="footer">${esc(data.phrases.footer)}</div>
  `, 5, a), `${data.meta.city} 현지어`));

  const meds = data.medicines.items.map((m,i)=>`<div class="medicine-card"><div class="row" style="align-items:center"><span class="badge">${i+1}</span><div class="section-label" style="font-size:33px">${esc(m.category)}</div></div><div style="margin-top:16px">${imageOrPlaceholder(m.image,m.localName)}</div><div class="section-label red" style="font-size:32px;margin-top:16px">${esc(m.localName)}</div><div class="section-label" style="font-size:34px;margin-top:10px">${esc(m.koName)}</div><div class="body compact" style="margin-top:8px">${esc(m.age)}</div></div>`).join('');
  cards.push(base(shell(`
    <div class="kicker-line"></div>
    <h1 class="title" style="font-size:82px">${esc(data.medicines.title)}</h1>
    <div class="subtitle" style="font-size:35px">${esc(data.medicines.subtitle)}</div>
    <div class="grid-2" style="margin-top:38px">${meds}</div>
    <div class="footer" style="font-size:29px"><div class="red">${esc(data.medicines.warning)}</div><div style="margin-top:12px">${esc(data.medicines.footer)}</div></div>
  `, 6, a), `${data.meta.city} 약품`));

  const rows = data.summary.rows.map((r,i)=>`<div class="row" style="padding:25px 0;border-bottom:2px solid var(--red)"><span class="badge" style="border-radius:5px;background:var(--ink)">${i+1}</span><div><div class="section-label" style="font-size:33px">${esc(r.label)}</div><div class="${i===0?'number':'body'}" style="${i===0?'font-size:65px;margin-top:10px':'font-size:32px;margin-top:9px;font-weight:750'}">${esc(r.value)}</div></div></div>`).join('');
  cards.push(base(shell(`
    <div class="kicker-line"></div>
    <h1 class="title xl" style="font-size:118px">${esc(data.summary.title)}</h1>
    <div style="margin-top:42px">${rows}</div>
    <div class="footer"><div class="save-box">${esc(data.summary.saveLine)}</div></div>
  `, 7, a), `${data.meta.city} 요약`));

  return cards;
}
