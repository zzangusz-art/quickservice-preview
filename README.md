# 퀵서비스다 공식 홈페이지 (정적 사이트 + 물류 가이드 AI 자동 발행)

## 바로 보기
- `preview.bat` 더블클릭 → 빌드 후 http://localhost:5520 이 열립니다.
- 직접: `node build.mjs` → `python -m http.server 5520 --directory dist`

## 폴더 구조
| 경로 | 내용 |
|---|---|
| `src/data.mjs` | **요금·차량 제원·FAQ·후기·비교 자료·회사 정보 — 사실 정보는 여기 한 곳만 고칩니다** |
| `src/home.mjs` | 홈(히어로 → 접수 5단계 스크롤 시퀀스 → 서비스 → 차량 가로 시퀀스 → 후기 → 요금 → 타사 비교 → 연계 지도 → 기업 → FAQ → 가이드) |
| `src/pages.mjs` | 서비스 4종·요금·차량 제원(추천 도구)·기업·회사 소개·FAQ·약관·블로그 페이지 |
| `src/layout.mjs` | `<head>`(메타·OG·JSON-LD), 헤더, 푸터, 모달·드로어·토스트·모바일 하단 바 |
| `src/schema.mjs` | 구조화 데이터(LocalBusiness·Service·FAQPage·BreadcrumbList·BlogPosting) |
| `src/art.mjs` | 아이콘, 차량 측면도(실제 적재함 길이 비율), 전국 연계 지도, 관제 화면 SVG |
| `assets/css/style.css` | 디자인 전체(Noto Sans KR) |
| `assets/js/app.js` | 모달·드로어·토스트·아코디언·탭·스켈레톤·스크롤 시퀀스·히어로 관제망 캔버스·차량 추천·요금 문의 글 만들기 |
| `content/blog/*.md` | 블로그 원고. `_topics.json` = AI가 쓸 주제 대기열 |
| `content/drafts/` | 검증에 떨어진 AI 초안(발행 안 됨). 고쳐서 `content/blog/`로 옮기면 발행 |
| `content/legal/` | 개인정보처리방침·이용약관 원문(기존 홈페이지에서 옮김) |
| `tools/blog-ai/generate.mjs` | AI 글 작성·검증기 |
| `tools/make-images.mjs` | 공유 이미지(OG)·파비콘을 크롬으로 렌더링(한 번만) |
| `tools/publish.mjs` / `publish.bat` | 빌드·검증 → 커밋 → AI 글 받기 → 푸시 |
| `.github/workflows/site.yml` | 푸시·하루 3회 예약 → (AI 글 1편) → 빌드 → GitHub Pages |
| `dist/` | 빌드 결과(올리는 파일). git에 넣지 않음 |

## 수정 → 반영
1. 요금·문구는 `src/data.mjs`, 화면 구성은 `src/*.mjs`, 디자인은 `assets/css/style.css`
2. `build.bat` (또는 `node build.mjs`) — 모든 페이지·JSON-LD·sitemap·robots·llms.txt·RSS가 같이 갱신되고, 깨진 링크·JSON-LD 오류를 검사합니다
3. 배포: 상위 폴더의 `deploy.bat`(더블클릭) — 빌드·글 검증 → 커밋 → AI가 올린 글 받기(`git pull --rebase`) → 푸시. GitHub Pages(미리보기)와 Railway(운영)가 2~3분 뒤 반영합니다. 바뀐 게 없으면 아무것도 안 합니다.
   - Claude Code가 `5. 퀵서비스다` 폴더에서 작업을 마칠 때마다 자동 실행됩니다(`.claude/settings.json` Stop 훅, 기록 `deploy.log`). 빌드·검증이 실패하면 커밋하지 않고 원인을 Claude에게 돌려줍니다.

## 배포 (GitHub Pages 미리보기)
- 저장소: https://github.com/zzangusz-art/quickservice-preview (공개 — 무료 계정 Pages는 공개 저장소만 가능하므로 프롬프트·검증 규칙도 공개됩니다)
- 미리보기 주소: https://zzangusz-art.github.io/quickservice-preview/ — 모든 페이지 noindex, robots.txt `Disallow: /` (검색 노출 안 됨)
- 이 폴더가 곧 git 저장소입니다(소스만 올리고 `dist/`·`node_modules/`는 제외). AI가 GitHub에서 글을 커밋하므로 로컬에서 고치기 전에 `git pull`로 받아 두면 충돌이 없습니다.

## 블로그(물류 가이드) 하루 3편 자동 발행
GitHub Actions가 **매일 09:23 · 13:23 · 18:23(KST)** (GitHub 예약 실행은 몇 시간 늦어질 수 있음) 에 `_topics.json`의 다음 `todo` 주제로 글 1편씩 쓰고, 검증을 통과하면 `content/blog/`에 커밋해 바로 배포합니다.
- 모델 `claude-opus-5-5`(effort high), 서버 측 폴백 `fallbacks: "default"` 사용. 근거는 `src/data.mjs`에서 만든 사실 목록뿐입니다.
- 검증: 머리말 형식, 본문 900~4,500자(공백 제외), 소제목 4개 이상, FAQ 2개 이상, 과장·보장·상투 표현 금지, 타사 상호·전화번호 금지, 외부 링크 금지, 허용된 내부 링크만, **사실 목록에 없는 숫자+단위 금지**.
- 한 번 고쳐 쓰게 하고도 떨어지면 `content/drafts/`에 두고 다음 주제로 넘어갑니다(회차당 최대 3개 주제 시도).
- 남은 주제가 6개 미만이면 기존 글과 겹치지 않는 새 주제 12개를 AI에게 받아 자동 보충합니다.
- 비용 감(참고): 글 1편당 입력 약 1만 토큰·출력 수천 토큰 → Opus 5.5 단가($4/$20 per 1M) 기준 편당 대략 0.1~0.2달러, 하루 3편이면 월 10~20달러 수준. 실제 청구는 Anthropic 콘솔에서 확인하세요.

설정(처음 한 번)
1. GitHub 저장소 → Settings → Pages → Source: **GitHub Actions**
2. Settings → Secrets and variables → Actions → New repository secret → `ANTHROPIC_API_KEY`
3. 지금 1편 써 보기: Actions 탭 → site → Run workflow (편수 1~5 선택)

로컬에서 쓰기/검사
- `set ANTHROPIC_API_KEY=...` 후 `npm ci` → `node tools/blog-ai/generate.mjs` (특정 주제 `--topic <id>`, 여러 편 `--count 3`)
- 검사만: `node tools/blog-ai/generate.mjs --check`
- 사람이 쓴 글: `content/blog/<slug>.md` 로 저장(머리말 `title` `description` `slug` `date` `category` `tags`, 선택 `time` `service`) → 빌드
- 예약 발행: 머리말 `date`+`time`(한국 시간)이 지나야 빌드에 들어갑니다. Railway 서버는 매시 정각에 다시 빌드하므로 09:00·13:00·18:00 글이 제시간에 공개되고, 새로 공개된 주소는 IndexNow로 네이버·빙에 알립니다. GitHub Pages 미리보기는 예약 실행 때 반영됩니다.
- 키워드 예약 글 50편(2026-10-28 ~ 11-13, 하루 3편): `_topics.json`의 `status: "scheduled"`. 이와 겹치던 대기 주제는 `merged`로 바꿔 AI가 다시 쓰지 않습니다. 예약 글이 남아 있는 동안 AI 자동 작성은 쉬고(`--force`로 무시), 다 나가면 남은 `todo` 주제로 이어 갑니다.
- 글에 쓸 수 있는 사실 목록 보기: `node tools/blog-ai/generate.mjs --facts`

## 서비스 지역(area/)
- `src/data.mjs`의 `AREAS`(서울 25개 구·인천 9개 구 2개 군·경기 31개 시군, 2026-10 행정구역)와 `AREA_CITIES`(지방 연계 도시). 각 구·시·군에 그 지역 글 slug를 적어 두면, 글이 공개된 뒤부터 자동으로 링크됩니다(없으면 지역 대표 글로).

## 운영 서버 (Railway)
- Railway 프로젝트 `pleasant-commitment` → 서비스 `quickservice-preview`가 이 저장소와 연결돼 있어, `main`에 푸시하면 자동 배포됩니다.
- `railway.json`: 빌드 단계에서 `build.mjs`·글 검증(실패하면 이전 판 유지), 실행은 `node tools/serve.mjs --production --url https://xn--2j1bs9sn9b30bc55a.kr/`.
- `tools/serve.mjs`: 외부 패키지 없는 정적 서버. 시작할 때·매시 정각 재빌드, brotli/gzip, 404, `www.` → 대표 주소 301, Railway 기본 주소(*.up.railway.app)는 noindex 헤더로 중복 색인 방지. 운영 빌드마다 새/바뀐 주소를 IndexNow(네이버·빙)로 알립니다(`tools/indexnow.mjs`, 키 파일 `/<SITE.indexNowKey>.txt`).
- 도메인: 퀵서비스다.kr은 Cloudflare 네임서버. Railway 서비스 Settings → Networking → Custom Domain에 `xn--2j1bs9sn9b30bc55a.kr`(+ `www.`)를 추가하고, Railway가 알려 주는 CNAME 값을 Cloudflare DNS에 넣습니다(가비아 시절 A 레코드는 삭제). Cloudflare SSL/TLS는 Full.

## 방문 분석 · 검색 등록
- `src/data.mjs` → `SITE.analytics`: `ga4`(G-…), `gtm`(GTM-…), `naver`(네이버 애널리틱스 wa 값), `clarity`(선택). Railway Variables `GA4_ID`·`GTM_ID`·`NAVER_WA`·`CLARITY_ID`로도 덮어쓸 수 있습니다(형식이 맞을 때만).
- 태그는 운영 빌드 + 대표 주소(퀵서비스다.kr) 접속에서만 불러옵니다. 다른 주소에서 시험하려면 `?qs_track=1`.
- 이벤트(`assets/js/app.js` 「방문 분석 이벤트」): `contact_call`·`contact_kakao`·`order_online`·`quote_submit`(→ GA4 주요 이벤트로 표시 권장, 네이버 전환 4), `quote_start`·`quick_book`·`quote_kakao`·`vehicle_recommend`·`service_detail`·`faq_open`·`process_step`·`read_progress`(25·50·75·100%) 등. GTM은 같은 이름의 dataLayer 이벤트로 받습니다.
- 검색 등록 인증값: `SITE.googleVerification`(서치 콘솔 HTML 태그), `SITE.naverVerification`(서치어드바이저 HTML 태그), `SITE.bingVerification`(Bing msvalidate.01 메타), `SITE.daumVerification`(다음 robots.txt 한 줄).

## 관리자 (유입·트래픽 / 콘텐츠)
- 주소: `https://퀵서비스다.kr/admin/` — `tools/admin/admin.mjs`(serve.mjs가 `/admin/*`·`/api/t`를 넘김), 외부 패키지 없음.
- 로그인: Railway Variables의 `ADMIN_PASSWORD`(7일 유지, 15분에 10회 실패하면 잠김). 설정 전에는 안내 화면만 나옵니다.
- 유입·트래픽: 일별 방문·페이지뷰, 채널(검색·AI·SNS·광고·캠페인·외부·직접), 출처, 검색어(네이버 등 리퍼러에 남을 때), 첫 페이지, 많이 본 페이지, 기기, UTM 캠페인, 문의 행동(전화·카톡·온라인 접수·요금 문의)과 전환율, 최근 방문 60건, CSV 내려받기. 유입 판정 규칙은 `tools/admin/inflow.mjs`(하나회원권 규칙 + 기존 .com·온라인 접수·당근·카카오맵).
- 콘텐츠: 발행·예약 글 목록(글별 조회·전환·키워드 겹침), 카테고리별 수, 마지막 예약일, 서비스 페이지 조회.
- 기록: 사이트 스크립트(`assets/js/app.js` 「자체 방문 기록」)가 대표 주소에서만, 탭마다 임시 방문 번호(sessionStorage, 쿠키·IP 저장 없음)로 첫 페이지 유입 경로·페이지뷰·문의 행동을 `/api/t`로 보냅니다. 관리자 화면을 연 브라우저·봇·다른 출처 요청은 제외.
- 저장: `RAILWAY_VOLUME_MOUNT_PATH`(Railway 볼륨, 마운트 경로 `/data` 권장)/`hits-YYYY-MM.jsonl`. 볼륨이 없으면 저장소의 `.data/`에 쌓이고 배포 때마다 초기화됩니다(관리자 화면 상단에 경고).

## AI·검색 노출 측정 · 블로그 겹침 점검 · 리포트
하나회원권 프로젝트의 측정 방식을 옮겨 왔습니다. 측정·리포트 파일은 저장소 밖(`../측정/`, `../보고/`)에 쌓여 배포와 섞이지 않습니다. 크롬 자동 실행에는 개발용 의존성 `puppeteer-core`를 씁니다(`npm ci`).
- 일일 캡처 `npm run ai:capture` (`tools/ai-exposure/capture.mjs`): 구글·네이버·네이버 AI탭·Bing·Perplexity·ChatGPT·Claude·Gemini × 핵심 키워드 10개(`lib.mjs`의 `QUERIES`: 퀵서비스다·서울퀵·오토바이 퀵·다마스 퀵·전국/수도권/인천/경기 퀵서비스·퀵서비스 추천·요금)를 측정 전용 크롬 창(프로필 `../측정/AI검색/.qs-capture-profile`)으로 열어 화면(jpg)·본문(txt)·`result.json`·`요약_<날짜>.md`를 남기고 `../측정/AI검색/추이.csv`에 누적합니다. 1시간 안팎.
  - 판정: 결과에 퀵서비스다.kr(퓨니코드 포함) 링크·주소 = 노출, 상호·대표번호만 = 상호 언급, 기존 사이트 퀵서비스다.com은 따로 표시. 인용된 외부 도메인도 기록합니다.
  - 봇 확인·차단 화면은 우회하지 않습니다. 나오면 그 엔진은 그날 '차단'으로 기록하고 건너뜁니다. Claude·Gemini는 측정용 크롬 창에서 한 번 로그인해 두면 그다음부터 측정됩니다(안 하면 '로그인 필요').
  - 같은 PC의 하나회원권 캡처가 돌고 있으면 끝날 때까지 기다립니다(`--no-wait`로 생략). 일부만: `--engines naver,bing --queries "서울퀵"`.
  - 판정 규칙은 `lib.mjs`의 `judge()` 한 곳. 규칙을 고치면 `node tools/ai-exposure/rejudge.mjs <날짜…>`로 저장된 본문을 다시 판정해 result.json·요약·추이.csv를 바로잡습니다(화면은 다시 열지 않음).
- 블로그 키워드 겹침 `npm run blog:overlap` (`tools/blog/overlap.mjs`): 전체 글끼리 비교. `--today --save`는 오늘 발행 글 + 3일 안 예약 글을 점검해 `../측정/블로그점검/<날짜>.md`에 저장, 제목을 인자로 주면 새 글 후보를 점검합니다. ⚠ = 주 키워드(머리말 `tags` 첫 항목)가 같거나 제목 앞머리가 겹침.
- 주간 리포트 `npm run ai:weekly` → `../보고/퀵서비스다_주간리포트_<날짜>.pdf`(지난주 같은 요일 측정 대비 새 노출·빠진 곳, 현황표, 이번 주 발행 글 겹침 점검, 인용 출처, 다음 주 할 일). 지난주 측정이 없으면 기준선 리포트.
- 월간 리포트 `npm run ai:monthly` (`--month YYYY-MM`, 기본은 어제가 속한 달) → `../보고/퀵서비스다_월간리포트_<YYYY-MM>.pdf`(일별 추이, 엔진·키워드별 노출률, 월초→월말 전후 화면, 블로그, 검색 등록 현황 `../측정/검색등록.json`, 인용 출처).
- 하루 묶음 `node tools/ai-exposure/daily.mjs`: 캡처 → 겹침 점검 → 예약 글 공개 확인(어제 18시~지금) → 목요일 주간·매월 1일 지난달 월간 리포트 → `../측정/일일/<날짜>.md`. Claude 데스크톱 예약 작업 `quickservice-ai-exposure-daily`(매일 14:00)가 이 스크립트를 별도 프로세스로 띄우고 바로 끝납니다(긴 세션이 '실행 중'으로 멈춰 다음 실행을 막는 일 방지). 앱이 꺼져 있으면 다음에 켤 때 실행됩니다.
- 예약 작업 `quickservice-daily-ops`(매일 19:00): 오늘 글 공개 확인 + 공개된 글을 구글 서치콘솔에서 색인 요청(사용자 크롬, 할당량 초과분은 다음 날) → `../측정/운영점검/<날짜>.md`·`색인요청.csv`. 파일 수정·배포·설정 변경은 하지 않습니다.

## 운영 도메인 전환
- 기본 운영 주소는 `src/data.mjs`의 `SITE.url`(퀵서비스다.kr = `https://xn--2j1bs9sn9b30bc55a.kr/`). 다른 주소면 이 값이나 `SITE_URL` 환경변수만 바꾸면 canonical·sitemap·JSON-LD·OG가 모두 따라갑니다.
- GitHub Pages에 붙일 때: Settings → Pages → Custom domain에 `xn--2j1bs9sn9b30bc55a.kr`, 저장소 Variables에 `SITE_MODE=production`(+필요하면 `SITE_URL`). 도메인 DNS(가비아)에 GitHub Pages 주소를 연결합니다.
- 기존 퀵서비스다.com은 새 주소로 **301 리다이렉트**해야 검색 순위가 이어집니다(기존 호스팅 업체에서 설정).
- 운영 전환 후: 네이버 서치어드바이저·구글 서치 콘솔에 새 도메인 등록 → sitemap.xml 제출, `SITE.naverVerification` 값을 새로 받은 값으로 교체.
- 운영 빌드에서만 미래애드원 로그 스크립트(`SITE.agencyScript`)가 들어갑니다. 미리보기 빌드에는 넣지 않습니다.

## 이미지
- 로고·사진은 모두 **기존 퀵서비스다.com 홈페이지의 고객사 이미지**입니다(AI 생성 이미지 없음).
  - `assets/img/brand/` — 컬러 로고(헤더·히어로), 흰색 로고(푸터), 파비콘·아이폰 아이콘
  - `assets/img/photo/` — 히어로 주행 사진(스카이블루 톤 보정), 배송 오토바이, 다마스·라보, 차량 옵션 8종, 톤수별 화물차 15종, KTX·고속버스·항공
- 다시 만들기: `python tools/prepare_photos.py ../research/legacy-html` (자르기·톤 보정·WebP 변환, 다른 업체 표기 지우기까지 같은 결과로 재현)
- 공유 이미지(OG): `node tools/make-images.mjs`
- 블로그 썸네일은 `src/data.mjs`의 `BLOG_IMAGES`에서 글 제목·태그 단어로 자동 선택합니다. 특정 사진으로 고정하려면 글 머리말에 `image: ktx`처럼 키를 적습니다. 바로 앞 두 글과 같은 사진은 피합니다.
