# Card Studio

한국인 해외여행자를 위한 도시별 위급정보 카드 7장을 자동 조사하고, 사람이 검수한 뒤 PNG로 확정하는 운영 프로젝트입니다.

## 현재 구현

- Next.js 기반 검수 화면과 로컬 Pretendard 폰트
- 기존 HTML 카드 생성기와 7장 디자인 레퍼런스
- Supabase 프로젝트·버전·출처·약품 자산·검수·자동화 실행 스키마
- Groq Compound를 이용한 공식 출처 우선 조사 초안
- 매일 한국시간 오전 6시 Vercel Cron 실행 (`0 21 * * *`, UTC)
- 승인 전 약품 이미지 자동 다운로드 및 발행 차단
- Supabase 연결 전에도 확인 가능한 디자인 샘플 폴백

## 무료 구성

- Vercel: Next.js 배포 및 하루 1회 Cron
- 기존 Supabase `card-proj`: 데이터베이스와 추후 승인 이미지 저장
- Groq: 조사 및 구조화 초안
- GitHub Actions: 추후 승인본 PNG 렌더링

OpenAI API는 현재 필수 항목이 아닙니다. ChatGPT 구독과 OpenAI API 사용료는 별도이며, 이 프로젝트의 1차 자동화는 Groq 무료 한도 내에서 동작하도록 구성합니다.

## 최초 설정

1. Supabase Dashboard의 SQL Editor에서 `supabase/migrations/001_card_studio.sql` 전체를 실행합니다.
2. Vercel Preview와 Production에 `.env.example`의 환경변수를 등록합니다. 실제 값은 저장소에 커밋하지 않습니다.
3. 배포 후 `/api/projects`가 프로젝트 5개를 반환하는지 확인합니다.
4. Cron은 `Authorization: Bearer <CRON_SECRET>` 헤더가 일치할 때만 실행됩니다.

현재 Vercel에는 다음 값이 등록되어 있어야 합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `CRON_SECRET`

## 로컬 실행

```bash
npm install
npm run dev
```

검증 명령:

```bash
npm run validate:sample
npm run build
```

## 안전 원칙

- 전화번호·병원·운영시간·지원 언어는 공식 원문 출처와 확인 날짜를 기록합니다.
- 생성 모델의 답변만으로 `한국어 가능`, `24시간`을 확정하지 않습니다.
- 약품은 제조사 등 공식 페이지의 실제 패키지 사진 후보만 수집합니다.
- 사용자가 정보와 사용 조건을 승인하기 전에는 이미지를 다운로드하거나 발행하지 않습니다.
- 모든 QA를 통과하기 전에는 `topics.csv` 상태를 `완료`로 바꾸지 않습니다.
