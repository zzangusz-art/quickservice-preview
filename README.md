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
3. `publish.bat` — 빌드·글 검증 → 커밋 → AI가 올린 글 받기(`git pull --rebase`) → 푸시. 2~3분 뒤 반영됩니다.

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
- 미래 날짜(`date`)로 저장한 글은 그날이 되어야 빌드에 들어갑니다(예약 발행).

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
