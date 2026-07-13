const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqDraft {
  cardData: Record<string, unknown>;
  research: Record<string, unknown>;
  sources: Array<Record<string, unknown>>;
  qaReport: Record<string, unknown>;
  caption: string;
  textVersion: string;
  medicineCandidates: Array<{
    category: string;
    localProductName: string;
    koreanProductName: string;
    sourceUrl: string;
    sourceType: string;
    usageNote: string;
  }>;
}

function extractJson(content: string): GroqDraft {
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned) as GroqDraft;
}

export async function generateResearchDraft(project: { country: string; city: string; topic: string }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const system = `당신은 한국인 해외여행자용 위급정보 카드의 조사 초안 작성자다.
사실을 추측하지 말고 외교부·대한민국 공관·현지 정부·병원·제조사 공식 사이트를 우선한다.
모든 핵심 사실에는 직접 확인 가능한 원문 URL, 확인 날짜, 출처 등급을 붙인다.
검색 요약문이나 블로그만으로 전화번호·운영시간·지원 언어를 확정하지 않는다.
약품은 실제 제조사 제품 페이지의 후보 URL만 제안하고 이미지를 다운로드하거나 승인했다고 표시하지 않는다.
한국어 가능, 24시간 같은 표현은 공식 근거가 있을 때만 사용한다.
확인되지 않은 값은 빈 문자열로 두고 qaReport.blockers에 기록한다.
카드 계정명은 반드시 @gaseongbi_crew다. 결과는 설명 없이 유효한 JSON 한 개만 반환한다.`;

  const user = `${project.country} ${project.city}에서 “${project.topic}” 상황에 쓰는 7장 카드 초안을 조사해라.
현재 날짜 기준으로 긴급전화, 병원, 공식 한인기관, 대표 커뮤니티, 현지어 제시 문장, 성인 여행자가 약사에게 문의할 현지 일반의약품 후보 4종을 조사한다.
JSON 최상위 키는 cardData, research, sources, qaReport, caption, textVersion, medicineCandidates로 한다.
cardData는 기존 생성기 구조(meta, cover, phones, hospitals, community, phrases, medicines, summary)를 사용한다.
각 sources 항목은 category, title, url, publisher, checkedAt, grade, supports를 포함한다.
qaReport는 passed(문자열 배열), blockers(문자열 배열), warnings(문자열 배열), humanReviewRequired(문자열 배열)를 포함한다.
medicineCandidates 각 항목은 category, localProductName, koreanProductName, sourceUrl, sourceType, usageNote를 포함한다.
medicines.items의 image는 모두 빈 문자열로 두며 실제 사진 승인 전에는 blockers에서 제거하지 않는다.`;

  const request = () => fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "groq/compound",
      temperature: 0.1,
      max_completion_tokens: 7000,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });

  let response = await request();
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") || "8");
    await response.text();
    await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(retryAfter, 2), 15) * 1000));
    response = await request();
  }
  const raw = await response.text();
  if (!response.ok) throw new Error(`Groq ${response.status}: ${raw.slice(0, 800)}`);
  const payload = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no draft content.");
  return extractJson(content);
}
