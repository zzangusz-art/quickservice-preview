// 퀵서비스다 물류 가이드 — AI 글 자동 작성기 (GitHub Actions가 하루 3번 실행)
// 사용:
//   node tools/blog-ai/generate.mjs              다음 주제 1편 작성 → 검증 통과 시 content/blog/<slug>.md 로 발행
//   node tools/blog-ai/generate.mjs --count 3    3편 연속 작성
//   node tools/blog-ai/generate.mjs --topic id   특정 주제
//   node tools/blog-ai/generate.mjs --check      API 호출 없이 기존 글 전체를 같은 검증기로 검사
// 남은 주제(todo)가 6개 아래로 떨어지면 기존 글과 겹치지 않는 새 주제를 AI에게 받아 대기열에 보충한다.
// 검증에 실패한 글은 발행하지 않고 content/drafts/ 에 남긴다(사람이 고쳐서 content/blog/ 로 옮기면 발행).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, loadPosts, isInternal } from '../blog/lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BLOG = path.join(ROOT, 'content/blog');
const DRAFTS = path.join(ROOT, 'content/drafts');
const TOPICS = path.join(BLOG, '_topics.json');
const MODEL = process.env.BLOG_MODEL || 'claude-opus-5-5';
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };

const D = await import('../../src/data.mjs');
const { SITE, START_FARES, FARE_RULES, PAYMENT, MOTO_TIME, MOTO_SIZE, SMALL_VEHICLES, TRUCKS, TRUCK_LIMITS, BODY_TYPES, CARGO_TYPES, INTERCITY, INTERCITY_NOTE, BUSINESS, FAQ, MARKET, SAVE_TIPS, BLOG_CATEGORIES, SERVICES, ASOF_LABEL, avg } = D;
const won = n => n.toLocaleString('ko-KR') + '원';

// ── 사실 목록: 사이트 데이터(src/data.mjs)에서만 만든다. 순서를 고정해 프롬프트 캐시가 유지되게 한다
function factSheet() {
  const L = [];
  L.push(`[업체] ${SITE.name}(${SITE.nameEn}). 서울·인천·경기 퀵서비스와 전국 화물운송 주선. ${SITE.freightLicense}. 대표전화 ${SITE.phone}(24시간·365일 접수). 카카오톡 채널 '퀵서비스다'. 사무실 ${SITE.address.full}. 사업자등록번호 ${SITE.bizNo}.`);
  L.push(`[운행 지역] ${SITE.area}.`);
  for (const f of START_FARES) L.push(`[시작 요금] ${f.label}: ${won(f.from)}부터(${ASOF_LABEL} 기준, ${SITE.vat}) — ${f.note}.`);
  L.push(`[요금 원리] ${FARE_RULES.basis}`);
  L.push(`[할증] ${FARE_RULES.surchargeWhen.map(s => `${s.k}(${s.v})`).join(', ')}.`);
  L.push(`[왕복] ${FARE_RULES.roundTrip}`);
  L.push(`[과적] ${FARE_RULES.overload}`);
  L.push(`[취소] ${FARE_RULES.cancelRule} ${FARE_RULES.cancel.map(c => `${c.k} ${c.v ? won(c.v) : '전화 문의'}`).join(', ')}.`);
  L.push(`[다마스·라보 요금] ${FARE_RULES.damasBase}`);
  L.push(`[다음 날 하차] ${FARE_RULES.nextDay}`);
  L.push(`[여유 배차] ${FARE_RULES.relaxed}`);
  L.push(`[급송] ${FARE_RULES.express}`);
  L.push(`[연계배송 할증] ${FARE_RULES.intercitySurcharge}`);
  L.push(`[결제] ${PAYMENT.methods.join(', ')}. ${PAYMENT.note} ${PAYMENT.invoice}`);
  L.push(`[오토바이 소요 시간] ${MOTO_TIME.map(t => `${t.k} ${t.v}`).join(', ')}.`);
  L.push(`[오토바이 적재] ${MOTO_SIZE.map(m => `${m.k}: ${m.v}`).join(' / ')}. 최대 25kg. 기본요금 기준은 중간 상자 1개·20kg.`);
  for (const v of SMALL_VEHICLES) L.push(`[차량] ${v.name}: ${v.max}, ${v.size}. 맞는 물건: ${v.use}. ${v.note}`);
  for (const t of TRUCKS) L.push(`[화물차 제원] ${t.ton}: 적재함 폭 ${t.w}cm, 길이 ${t.len[0] === t.len[1] ? t.len[0] : t.len.join('~')}cm, 지상고 ${t.deck}cm${t.cbm ? `, 부피 약 ${t.cbm}CBM` : ''}, 탑차·윙바디 높이 ${t.top[0] === t.top[1] ? t.top[0] : t.top.join('~')}cm.`);
  for (const t of TRUCK_LIMITS) L.push(`[적재 한도] ${t}`);
  for (const b of BODY_TYPES) L.push(`[적재함 형태] ${b.name}: ${b.desc}`);
  for (const c of CARGO_TYPES) L.push(`[화물 운송] ${c.k}: ${c.v}`);
  for (const m of INTERCITY) L.push(`[연계배송] ${m.name}: 최대 ${m.hours}시간 이내 문전 배송, ${won(m.from)}부터(차등 있음). 구간 ${m.routes}. 접수 때 확인: ${m.check}. ${m.desc}`);
  L.push(`[연계배송 접수] ${INTERCITY_NOTE}`);
  L.push(`[기업 월 정산] 대상: ${BUSINESS.who.join(', ')}. 서비스: ${BUSINESS.services.join(', ')}. ${BUSINESS.benefits.join(' ')} ${BUSINESS.contract}`);
  for (const t of SAVE_TIPS) L.push(`[요금 줄이기] ${t.t}: ${t.d}`);
  L.push(`[타사 비교] ${MARKET.note} ${MARKET.sets.map(s => `${s.label}: 퀵서비스다 ${won(s.ours)}, 비교 업체 ${s.others.map(o => won(o.v)).join('·')}(평균 ${won(avg(s.others.map(o => o.v)))})`).join(' / ')}. 업체명은 쓰지 않는다.`);
  L.push('[손해배상] 배송장에 물건 가액을 적으면 그 가액이 배상 기준, 적지 않으면 이용약관상 손해배상 한도 50만 원. 50만 원이 넘거나 특별히 조심할 물건은 접수 때 알린다. 가액 300만 원 초과 물건은 이륜차 배송을 거절할 수 있다(이용약관).');
  for (const f of FAQ) L.push(`[FAQ] ${f.q} → ${f.a}`);
  return L.join('\n');
}
function allowedNumbers(sheet) {
  const set = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '2026', '2027', '24', '365', '50', '300']);
  for (const m of sheet.matchAll(/\d[\d,]*(?:\.\d+)?/g)) set.add(m[0].replace(/,/g, ''));
  return set;
}

const COMPETITORS = ['하나로퀵', '고수퀵', '전진퀵', '다배달', '빠름퀵', '트래블퀵', '퀵스콜', '8585퀵', '카카오T', '카카오 T', '카카오퀵', '배민', '바로고', '부릉', '생각대로', '고고밴', '짐캐리', '인성퀵', '원더스', '오늘의픽업', '로지올', '용달넷', '화물맨', '전국24시콜'];
const BANNED = [
  [/최고의|최상의|업계 ?1위|국내 ?1위|유일한|유일하게|단연|압도적|완벽한|완벽하게|혁신적인|놀라운|무조건|100% ?보장|100% ?만족/, '최상급·과장 표현'],
  [/파손 ?걱정(?:이)? 없|절대 (?:늦지|파손)|반드시 도착|늦으면 (?:전액|무료)|보장합니다/, '보장성 단정'],
  [/알아보겠습니다|살펴보겠습니다|결론적으로|요약하자면|꿀팁|정리해 ?드리겠습니다|에 대해 알아|🙂|😊|👍|✨|💡|🚚|📦/, '상투 표현·이모지'],
];
const UNITS = /(\d[\d,]*(?:\.\d+)?)\s*(원|kg|cm|CBM|m|톤|분|시간|시|%|개|일|km|명|건)/g;

function validate(md, { allowed, slugs }) {
  const errs = [];
  let meta, body;
  try { ({ meta, body } = parseFrontmatter(md)); } catch (e) { return { ok: false, errs: ['머리말 형식 오류: ' + e.message] }; }
  for (const k of ['title', 'description', 'slug', 'category', 'tags']) if (!meta[k] || (Array.isArray(meta[k]) && !meta[k].length)) errs.push(`머리말 ${k} 누락`);
  if (meta.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) errs.push('slug는 영문 소문자·숫자·하이픈만');
  if (meta.slug && slugs.has(meta.slug)) errs.push(`이미 있는 slug: ${meta.slug}`);
  if (meta.category && !BLOG_CATEGORIES.includes(meta.category)) errs.push(`category는 ${BLOG_CATEGORIES.join('/')} 중 하나`);
  if (meta.title && (meta.title.length < 12 || meta.title.length > 60)) errs.push(`제목은 12~60자(현재 ${meta.title.length}자)`);
  if (meta.description && (meta.description.length < 40 || meta.description.length > 150)) errs.push(`설명은 40~150자(현재 ${meta.description.length}자)`);
  const len = (body || '').replace(/\s+/g, '').length;
  if (len < 900 || len > 4500) errs.push(`본문 길이 ${len}자(공백 제외) — 900~4,500자`);
  if (!/\n##\s+자주 묻는 질문/.test('\n' + body)) errs.push('"## 자주 묻는 질문" 섹션 없음');
  if ((body.match(/\n###\s+Q\./g) || []).length < 2) errs.push('FAQ 질문(### Q.) 2개 이상 필요');
  if ((body.match(/^##\s/mg) || []).length < 4) errs.push('## 소제목 4개 이상 필요(FAQ 포함)');
  for (const [re, why] of BANNED) { const m = md.match(re); if (m) errs.push(`금지 표현(${why}): "${m[0]}"`); }
  for (const c of COMPETITORS) if (body.includes(c)) errs.push(`타사 상호 사용: ${c}`);
  for (const m of body.matchAll(/(?<![\d-])(1[5-9]\d\d)-\d{4}/g)) if (m[0] !== SITE.phone) errs.push(`다른 업체 전화번호로 보이는 번호: ${m[0]}`);
  for (const m of md.matchAll(/https?:\/\/[^\s)]+/g)) errs.push(`외부 링크 금지: ${m[0]}`);
  for (const m of body.matchAll(/\]\(([^)\s]+)\)/g)) if (!/^https?:/.test(m[1]) && !isInternal(m[1])) errs.push(`허용되지 않은 내부 링크: ${m[1]}`);
  const unknown = new Set();
  for (const m of body.matchAll(UNITS)) { const n = m[1].replace(/,/g, ''); if (!allowed.has(n)) unknown.add(m[0]); }
  if (unknown.size) errs.push(`사실 목록에 없는 수치: ${[...unknown].join(', ')}`);
  return { ok: errs.length === 0, errs, meta, len };
}

const LINKS = ['pricing/', 'pricing/#compare', 'vehicles/', 'vehicles/#recommend', 'business/', 'faq/', 'about/', ...SERVICES.map(s => s.slug)];
const SYSTEM = sheet => `당신은 퀵서비스·화물운송 주선 업체 "퀵서비스다" 홈페이지의 "물류 가이드" 담당 에디터입니다. 물건을 보내려는 사람이 검색창이나 AI 비서에게 묻는 질문에, 업체가 직접 확인한 사실로 답하는 글을 씁니다. 독자는 사무실 총무·구매 담당자, 소상공인, 이사·중고거래를 하는 개인입니다.

# 반드시 지킬 것
- 아래 [사실 목록]에 있는 내용만 사실로 씁니다. 목록에 없는 요금·구간별 금액·시간·통계·후기·사례를 만들지 않습니다. 특정 구간(예: 강남→판교)의 금액은 쓰지 말고 "출발·도착 동을 알려 주면 확정 요금을 먼저 안내한다"고 씁니다.
- 지역을 다루는 글이라도 그 지역에 대해 사실 목록에 없는 정보(교통 상황, 거리, 건물명 등)를 단정하지 않습니다.
- 다른 퀵·화물 업체의 상호나 전화번호를 쓰지 않습니다. 시장 비교는 [사실 목록]의 공개 요금 비교만 조회 시점과 함께 씁니다. 다른 업체를 깎아내리지 않습니다.
- 최상급·과장 표현(최고, 1위, 유일, 완벽, 무조건, 보장)과 상투 표현(알아보겠습니다, 결론적으로, 꿀팁), 이모지를 쓰지 않습니다.
- 요금은 바뀔 수 있으니 "${ASOF_LABEL} 기준", "부가세 별도"를 함께 씁니다.

# 문체
- 존댓말 "-습니다/-입니다"체. 한 문장은 짧게, 한 문단은 2~4문장.
- 첫 문단에서 질문에 바로 답합니다(결론 먼저). 그다음 이유와 숫자.
- 비교는 마크다운 표로 씁니다. 목록은 꼭 필요할 때만.
- 현장에서 상담하는 사람이 설명하듯 구체적으로. 같은 문장 구조를 반복하지 않고, 문단을 "~하는 것이 중요합니다" 같은 말로 끝내지 않습니다.
- 내부 링크는 다음 경로만 씁니다(사이트 루트 기준, 앞에 / 없이): ${LINKS.join(', ')}, 그리고 이미 발행된 글 blog/<slug>/. 전화 링크는 [1661-7462](tel:16617462). 외부 링크는 쓰지 않습니다.

# 출력 형식 (이 형식 외의 말은 출력하지 않습니다)
---
title: (12~60자, 검색 질문이 드러나게)
description: (40~150자, 글의 답을 한 문장으로)
slug: (영문 소문자-하이픈, 주제 뜻이 드러나게)
category: (${BLOG_CATEGORIES.join(' | ')} 중 하나)
tags: (쉼표로 구분 3~5개)
---
(첫 문단: 질문에 대한 답)

## (소제목 3~5개, 질문형 소제목을 1개 이상 섞기)
...

## 자주 묻는 질문

### Q. (질문)
(답 1~3문장)

### Q. (질문)
(답 1~3문장)

본문은 공백 제외 1,200~2,600자로 씁니다.

[사실 목록]
${sheet}`;

function userMsg(topic, posts, today) {
  return `오늘 날짜: ${today}
주제 ID: ${topic.id}
주제: ${topic.title}
다룰 방향: ${topic.angle}
포함할 검색어: ${(topic.keywords || []).join(', ')}
권장 카테고리: ${topic.category}

이미 발행된 글(내용이 겹치지 않게 하고, 관련 있으면 내부 링크로 연결):
${posts.slice(0, 60).map(p => `- ${p.title} → blog/${p.slug}/`).join('\n') || '- 없음'}

위 형식대로 글 한 편을 써 주세요.`;
}

async function callClaude(client, system, messages, maxTokens = 16000) {
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // 안전 분류기가 거절하면 서버가 권장 모델로 다시 시도
    output_config: { effort: 'high' },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages,
  });
  if (res.stop_reason === 'refusal') return { refused: true, res };
  if (res.stop_reason === 'max_tokens') throw new Error('max_tokens 도달 — 글이 잘렸습니다');
  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('').trim().replace(/^```(?:markdown|json)?\s*|\s*```$/g, '');
  return { text, res };
}

// 주제 보충: 기존 주제·글과 겹치지 않는 새 주제 12개
async function refillTopics(client, system, topics, posts) {
  const known = [...topics.map(t => t.title), ...posts.map(p => p.title)];
  const msg = `물류 가이드에 이어서 쓸 새 주제 12개를 제안해 주세요. 조건:
- 아래 기존 주제·글과 겹치지 않을 것
- [사실 목록]만으로 정확하게 쓸 수 있을 것(목록에 없는 숫자가 필요한 주제는 제외)
- 카테고리(${BLOG_CATEGORIES.join(', ')})를 고르게 섞고, 서울·인천·경기 지역 이름이 들어간 주제를 3개 이상 포함(지역 정보는 단정하지 말고 요금 정하는 방식·차량 선택·접수 방법 중심)
- 사람들이 실제로 검색하는 질문 형태

기존 주제·글:
${known.map(t => `- ${t}`).join('\n')}

JSON 배열만 출력하세요. 각 항목: {"id": "영문-소문자-하이픈", "title": "주제(질문형 가능)", "angle": "다룰 내용과 주의점 1~2문장", "category": "카테고리", "keywords": ["검색어", "..."], "service": "${SERVICES.map(s => s.id).join('|')}|"}`;
  const out = await callClaude(client, system, [{ role: 'user', content: msg }], 8000);
  if (out.refused) return 0;
  let list;
  try { list = JSON.parse(out.text.slice(out.text.indexOf('['), out.text.lastIndexOf(']') + 1)); } catch (e) { console.log('주제 보충 응답을 읽지 못했습니다:', e.message); return 0; }
  const ids = new Set(topics.map(t => t.id));
  let n = 0;
  for (const t of list) {
    if (!t || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.id || '') || ids.has(t.id) || !BLOG_CATEGORIES.includes(t.category) || !t.title) continue;
    topics.push({ id: t.id, title: String(t.title), angle: String(t.angle || ''), category: t.category, keywords: (t.keywords || []).map(String).slice(0, 6), service: SERVICES.some(s => s.id === t.service) ? t.service : '', status: 'todo', source: 'ai' });
    ids.add(t.id); n++;
  }
  return n;
}

async function main() {
  const sheet = factSheet();
  const allowed = allowedNumbers(sheet);
  const posts = loadPosts(BLOG);

  if (flag('--check')) {
    let bad = 0;
    for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.md') && !f.startsWith('_'))) {
      const v = validate(fs.readFileSync(path.join(BLOG, f), 'utf8'), { allowed, slugs: new Set() });
      console.log(`${v.ok ? 'OK ' : 'NG '} ${f} (${v.len ?? '?'}자)${v.ok ? '' : '\n    - ' + v.errs.join('\n    - ')}`);
      if (!v.ok) bad++;
    }
    process.exit(bad ? 1 : 0);
  }

  const topics = JSON.parse(fs.readFileSync(TOPICS, 'utf8'));
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic(); // ANTHROPIC_API_KEY 등 환경 자격 증명 사용
  const now = new Date();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const system = SYSTEM(sheet);
  const count = Math.max(1, Math.min(5, Number(opt('--count')) || 1));

  if (topics.filter(t => t.status === 'todo').length < 6) {
    const n = await refillTopics(client, system, topics, posts);
    console.log(`주제 보충: ${n}개 추가`);
    fs.writeFileSync(TOPICS, JSON.stringify(topics, null, 2) + '\n');
  }

  // 한 편이 검증에 두 번 떨어지면 초안으로 돌리고 다음 주제로 넘어가, 정해진 편수를 채운다(최대 count+2 주제 시도)
  const id = opt('--topic');
  let published = 0, tried = 0;
  while (published < count && tried < (id ? 1 : count + 2)) {
    tried++;
    const topic = id ? topics.find(t => t.id === id) : topics.find(t => t.status === 'todo');
    if (!topic) { console.log('작성할 주제가 없습니다(_topics.json 의 status:"todo" 없음).'); break; }
    if (await writeOne(topic)) published++;
    fs.writeFileSync(TOPICS, JSON.stringify(topics, null, 2) + '\n');
  }
  console.log(`이번 실행: 발행 ${published}편 / 시도 ${tried}개 주제`);
  if (!published && !flag('--allow-empty')) process.exitCode = 2;

  async function writeOne(topic) {
    const cur = loadPosts(BLOG);
    const slugs = new Set(cur.map(p => p.slug));
    const messages = [{ role: 'user', content: userMsg(topic, cur, today) }];
    let out, v;
    for (let attempt = 1; attempt <= 2; attempt++) {
      out = await callClaude(client, system, messages);
      if (out.refused) { console.log(`[${topic.id}] 거절됨(${out.res.stop_details?.category ?? '분류 없음'}) — 이 주제는 건너뜁니다.`); topic.status = 'skipped'; return false; }
      const u = out.res.usage;
      console.log(`[${topic.id}] 응답 ${attempt}차: 입력 ${u.input_tokens} / 캐시 읽기 ${u.cache_read_input_tokens ?? 0} / 출력 ${u.output_tokens} 토큰, 모델 ${out.res.model}`);
      v = validate(out.text, { allowed, slugs });
      if (v.ok) break;
      console.log('검증 실패:\n  - ' + v.errs.join('\n  - '));
      if (attempt === 1) {
        messages.push({ role: 'assistant', content: out.res.content }); // 응답은 고치지 않고 그대로 되돌려 보낸다
        messages.push({ role: 'user', content: `아래 문제를 고쳐서 같은 형식으로 글 전체를 다시 써 주세요.\n- ${v.errs.join('\n- ')}` });
      }
    }
    let md;
    try {
      const { meta, body } = parseFrontmatter(out.text);
      let slug = meta.slug || topic.id; while (slugs.has(slug)) slug += '-2';
      const front = ['---', `title: ${meta.title}`, `description: ${meta.description}`, `slug: ${slug}`, `date: ${today}`, `time: ${time}`,
        `category: ${meta.category}`, `tags: ${meta.tags.join(', ')}`, `service: ${topic.service || ''}`, 'author: 퀵서비스다 운영팀', `generated: ${MODEL} ${today}`, `topic: ${topic.id}`, '---'].join('\n');
      md = `${front}\n${body}\n`;
      if (v.ok) {
        fs.writeFileSync(path.join(BLOG, `${slug}.md`), md);
        console.log(`발행: content/blog/${slug}.md (${v.len}자)`);
        topic.status = 'done'; topic.slug = slug; topic.date = today;
        return true;
      }
    } catch (e) { md = out.text; }
    fs.mkdirSync(DRAFTS, { recursive: true });
    const f = path.join(DRAFTS, `${today}-${topic.id}.md`);
    fs.writeFileSync(f, `<!-- 검증 실패로 발행하지 않음:\n- ${v.errs.join('\n- ')}\n-->\n` + md);
    console.log(`초안으로 저장: ${path.relative(ROOT, f)}`);
    topic.status = 'draft'; topic.draft = path.relative(ROOT, f).replace(/\\/g, '/');
    return false;
  }
}

main().catch(async err => {
  const { default: Anthropic } = await import('@anthropic-ai/sdk').catch(() => ({ default: null }));
  if (Anthropic && err instanceof Anthropic.AuthenticationError) console.error('인증 실패: ANTHROPIC_API_KEY를 확인하세요.');
  else if (Anthropic && err instanceof Anthropic.RateLimitError) console.error('요청 한도 초과: 잠시 뒤 다시 실행하세요.');
  else if (Anthropic && err instanceof Anthropic.BadRequestError) console.error('요청 오류(400):', err.message);
  else if (Anthropic && err instanceof Anthropic.APIConnectionError) console.error('연결 오류:', err.message);
  else if (Anthropic && err instanceof Anthropic.APIError) console.error(`API 오류 ${err.status}:`, err.message);
  else console.error(err);
  process.exit(1);
});
