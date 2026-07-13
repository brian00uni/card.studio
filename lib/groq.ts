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

type CardDataShape = {
  meta?: { account?: string };
  phones?: { primaryNumber?: string };
  hospitals?: { items?: unknown[] };
  phrases?: { groups?: unknown[] };
  medicines?: { items?: unknown[] };
  summary?: { rows?: unknown[] };
};

function extractJson(content: string): GroqDraft {
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  const draft = JSON.parse(cleaned) as GroqDraft;
  const data = draft.cardData as CardDataShape;
  const valid =
    data?.meta?.account === "@gaseongbi_crew" &&
    data?.phones?.primaryNumber !== undefined &&
    Array.isArray(data?.hospitals?.items) &&
    Array.isArray(data?.phrases?.groups) &&
    data.phrases.groups.length === 3 &&
    Array.isArray(data?.medicines?.items) &&
    data.medicines.items.length === 4 &&
    Array.isArray(data?.summary?.rows) &&
    Array.isArray(draft.sources) &&
    Array.isArray(draft.medicineCandidates);
  if (!valid) throw new Error("Groq returned an invalid card-data structure.");
  return draft;
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

  const searchPrompt = `${project.country} ${project.city}에서 한국인 여행자가 갑자기 아프거나 다쳤을 때 필요한 정보를 조사한다.
웹 검색은 한 번만 사용하고 결과는 간결하게 작성한다. 다음 항목별로 공식 출처 URL과 그 출처에서 직접 확인되는 핵심 사실만 정리한다.
1) 대한민국 외교부·현지 대한민국 공관의 긴급 연락처
2) 현지 정부의 구급차·경찰 번호
3) 병원 공식 사이트의 전화·주소·지원 언어
4) 공식 한인기관
5) 호텔·택시·병원에서 보여줄 짧은 현지어 문장
6) 제조사 공식 사이트의 성인 일반의약품 후보 4종
최대 12개 출처만 사용한다. 블로그와 검색 요약만으로 사실을 확정하지 않는다. 확인되지 않은 값은 미확인이라고 쓴다.`;

  const searchResponse = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "groq/compound-mini",
      temperature: 0,
      max_completion_tokens: 1800,
      messages: [{ role: "user", content: searchPrompt }],
    }),
  });
  const searchRaw = await searchResponse.text();
  if (!searchResponse.ok) throw new Error(`Groq search ${searchResponse.status}: ${searchRaw.slice(0, 800)}`);
  const searchPayload = JSON.parse(searchRaw) as { choices?: Array<{ message?: { content?: string } }> };
  const researchText = searchPayload.choices?.[0]?.message?.content;
  if (!researchText) throw new Error("Groq search returned no research content.");

  const user = `아래는 ${project.country} ${project.city}에서 “${project.topic}” 상황에 쓰는 카드의 웹 조사 결과다.
조사 결과에 명시된 사실과 URL만 사용해 7장 카드 초안 JSON을 만든다. 출처가 불충분한 값은 빈 문자열로 두고 blockers에 기록한다.

<research>
${researchText}
</research>

JSON 최상위 키는 cardData, research, sources, qaReport, caption, textVersion, medicineCandidates로 한다.
cardData는 아래 필드 구조를 정확히 사용한다.
meta{country,countryCode,city,slug,topic,verifiedAt,account},
cover{eyebrow,city,headline,subline,saveLine},
phones{title,primaryLabel,primaryNumber,secondary:[{label,number}],ambulance,police,footer},
hospitals{title,items:[{name,language,phone,note}],emergency,footer},
community{title,official:{name,phone,note},communityName,communityNote,warnings:[문자열],footer},
phrases{title,subtitle,groups:[{target,lines:[{local,ko}]}] 정확히 3개,footer},
medicines{title,subtitle,items:[{category,localName,koName,age,image}] 정확히 4개,warning,footer},
summary{title,rows:[{label,value}],saveLine}.
각 sources 항목은 category, title, url, publisher, checkedAt, grade, supports를 포함한다.
qaReport는 passed(문자열 배열), blockers(문자열 배열), warnings(문자열 배열), humanReviewRequired(문자열 배열)를 포함한다.
medicineCandidates 각 항목은 category, localProductName, koreanProductName, sourceUrl, sourceType, usageNote를 포함한다.
medicines.items의 image는 모두 빈 문자열로 두며 실제 사진 승인 전에는 blockers에서 제거하지 않는다.`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_completion_tokens: 3800,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Groq ${response.status}: ${raw.slice(0, 800)}`);
  const payload = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no draft content.");
  return extractJson(content);
}
