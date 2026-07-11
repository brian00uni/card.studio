"use client";

import { useEffect, useMemo, useState } from "react";

const cards = [
  { no: "01", type: "표지", image: "/reference/01-cover-approved-style.png" },
  { no: "02", type: "긴급전화", image: "/reference/02-phone-approved-style.png" },
  { no: "03", type: "병원", image: "/reference/03-hospital-approved-style.png" },
  { no: "04", type: "현지 도움", image: "/reference/04-community-approved-style.png" },
  { no: "05", type: "보여주기", image: "/reference/05-phrases-approved-style.png" },
  { no: "06", type: "약품", image: "/reference/06-medicine-approved-style.png" },
  { no: "07", type: "요약", image: "/reference/07-summary-approved-style.png" },
];

const defaultPrompt = `topics.csv에서 상태가 대기인 첫 도시를 선택한다.
공식 기관과 제조사 자료를 우선해 최신 정보를 조사한다.
인터넷 이미지는 출처와 사용 조건을 기록하고 로컬 사본으로 저장한다.
HTML 카드 7장, sources.md, image-sources.md, qa-report.md를 생성한다.
샘플 문구나 확인되지 않은 정보가 있으면 REVIEW_READY로 전환하지 않는다.`;

const queue = [
  { city: "오사카", country: "일본", status: "검수 준비", date: "오늘 06:42" },
  { city: "다낭", country: "베트남", status: "대기", date: "내일 06:00" },
  { city: "나트랑", country: "베트남", status: "대기", date: "순서 3" },
];

export default function Home() {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"cards" | "prompt" | "sources" | "qa">("cards");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [saved, setSaved] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("card-studio-prompt");
    if (stored) setPrompt(stored);
  }, []);

  const qa = useMemo(() => [
    ["HTML 카드 7장", true],
    ["@gaseongbi_crew 표기", true],
    ["외부 폰트 요청 없음", true],
    ["공식 전화번호 검증", false],
    ["실제 약품 이미지 승인", false],
    ["현지어 사람 검수", false],
  ] as const, []);

  function savePrompt() {
    window.localStorage.setItem("card-studio-prompt", prompt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">G</span><div><strong>Card Studio</strong><small>gaseongbi crew</small></div></div>
        <section className="side-section">
          <p className="side-label">제작 대기열</p>
          {queue.map((item, index) => (
            <button key={item.city} className={`queue-item ${index === 0 ? "active" : ""}`}>
              <span><b>{item.city}</b><small>{item.country}</small></span>
              <em>{item.status}</em>
            </button>
          ))}
        </section>
        <div className="schedule-card"><span className="pulse"/><div><small>다음 자동 생성</small><strong>내일 오전 6:00</strong><p>오전 7시 전 검수 대기</p></div></div>
        <div className="stack"><span>Vercel</span><span>Supabase</span><span>Hugging Face</span></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="breadcrumb">프로젝트 / 일본</p><h1>오사카 위급정보 카드</h1></div>
          <div className="top-actions"><span className="status-dot">검수 준비 전</span><button className="button ghost">공유 링크</button><button className="button primary" onClick={() => setApproved(true)}>PNG 생성 승인</button></div>
        </header>

        <nav className="tabs">
          {([['cards','카드 미리보기'],['prompt','자동화 프롬프트'],['sources','출처·이미지'],['qa','QA 검수']] as const).map(([id,label]) =>
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
          )}
        </nav>

        {tab === "cards" && <div className="content-grid">
          <section className="preview-panel">
            <div className="section-heading"><div><span className="eyebrow">CARD {cards[selected].no} / 07</span><h2>{cards[selected].type}</h2></div><span className="sample-badge">디자인 샘플 · 게시 금지</span></div>
            <div className="phone-stage">
              <figure className="reference-frame">
                <img src={cards[selected].image} alt={`승인된 오사카 ${cards[selected].type} 카드 디자인`} />
                <figcaption>공유 채팅에서 확정한 승인 디자인 레퍼런스</figcaption>
              </figure>
            </div>
            <div className="pager"><button disabled={selected === 0} onClick={() => setSelected(v => v - 1)}>이전</button><div>{cards.map((_,i)=><button key={i} aria-label={`${i+1}번 카드`} className={selected===i?'active':''} onClick={()=>setSelected(i)}/>)}</div><button disabled={selected === 6} onClick={() => setSelected(v => v + 1)}>다음</button></div>
          </section>
          <aside className="inspection">
            <div className="inspection-head"><h2>검수 메모</h2><span>3개 확인 필요</span></div>
            <label>카드 상태<select defaultValue="review"><option value="review">수정 필요</option><option value="approved">승인</option></select></label>
            <label>수정 요청<textarea defaultValue="실제 조사 데이터로 교체한 뒤 전화번호와 이미지 출처를 다시 확인해주세요." /></label>
            <div className="quick-check"><p>빠른 확인</p>{qa.slice(0,4).map(([label,ok])=><div key={label}><span className={ok?'ok':'wait'}>{ok?'✓':'!'}</span>{label}</div>)}</div>
            <button className="button wide">수정 요청 저장</button>
          </aside>
        </div>}

        {tab === "prompt" && <section className="editor-view"><div className="section-heading"><div><span className="eyebrow">AUTOMATION PROMPT</span><h2>매일 아침 제작 지시문</h2></div><button className="button primary" onClick={savePrompt}>{saved ? "저장됨" : "프롬프트 저장"}</button></div><p className="helper">이곳에서 다음 도시 선택, 조사 기준, 카드 구성과 실패 처리 규칙을 편집합니다. 현재는 이 브라우저에 임시 저장되며 Supabase 연결 후 팀 공용 버전으로 전환됩니다.</p><textarea className="prompt-editor" value={prompt} onChange={e=>setPrompt(e.target.value)}/><div className="prompt-footer"><span>예약 목표: 매일 오전 6시 실행 · 오전 7시 검수 준비</span><span>{prompt.length}자</span></div></section>}

        {tab === "sources" && <section className="table-view"><div className="section-heading"><div><span className="eyebrow">SOURCE REGISTRY</span><h2>정보·이미지 출처</h2></div><button className="button ghost">출처 추가</button></div><div className="source-row head"><span>항목</span><span>출처 등급</span><span>확인 상태</span><span>마지막 확인</span></div>{[['한국어 긴급전화','공식 공관 · A','확인 필요','—'],['병원 운영정보','병원 공식 · A','확인 필요','—'],['약품 패키지','제조사 공식 · A','자산 필요','—'],['현지어 문장','사람 검수','감수 필요','—']].map(r=><div className="source-row" key={r[0]}>{r.map((c,i)=><span key={i}>{c}</span>)}</div>)}</section>}

        {tab === "qa" && <section className="qa-view"><div className="section-heading"><div><span className="eyebrow">QUALITY GATE</span><h2>발행 전 검수</h2></div><span className="score">3 / 6 통과</span></div><div className="qa-list">{qa.map(([label,ok])=><div key={label}><span className={ok?'ok':'wait'}>{ok?'✓':'!'}</span><strong>{label}</strong><em>{ok?'통과':'확인 필요'}</em></div>)}</div><div className={`approval-box ${approved?'approved':''}`}><div><strong>{approved?'PNG 생성이 승인되었습니다':'모든 필수 QA 통과 후 승인하세요'}</strong><p>{approved?'실제 렌더러 연결 후 1080×1920 PNG 7장이 생성됩니다.':'현재 샘플 데이터이므로 실제 발행 파일은 생성하지 않습니다.'}</p></div></div></section>}
      </section>
    </main>
  );
}
