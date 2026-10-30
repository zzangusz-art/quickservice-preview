// 하루 자동 점검 묶음 — AI·검색 노출 캡처 → 블로그 키워드 겹침 점검 → (목) 주간 리포트 → (매월 1일) 지난달 월간 리포트 → 측정/일일/<날짜>.md
// 예약 작업은 이 스크립트를 따로 띄워 두고 바로 끝난다. 한 시간 넘는 세션이 '실행 중'으로 멈춰 다음 실행을 막는 일을 피하려는 구조
// (하나회원권 캡처 예약이 10/25부터 그렇게 멈춰 있음).
//   node tools/ai-exposure/daily.mjs [--skip-capture] [--date YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO, PROJ, AI_DIR, ENG, QUERIES, readRows, makeCell, kstDate, addDays, weekday, arg, flag } from './lib.mjs';

const DATE = arg('date', kstDate());
const OUT = path.join(PROJ, '측정', '일일'); fs.mkdirSync(OUT, { recursive: true });
const log = (s) => { const line = `[${new Date(Date.now() + 9 * 3600e3).toISOString().slice(11, 19)}] ${s}`; console.log(line); };
const run = (label, args, minutes) => {
  log(`${label} 시작`);
  const r = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8', timeout: minutes * 60e3, maxBuffer: 32 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  const ok = r.status === 0 && !r.error;
  log(`${label} ${ok ? '완료' : `실패(${r.error ? r.error.message : 'exit ' + r.status})`}`);
  return { ok, out, tail: out.split(/\r?\n/).slice(-6).join('\n') };
};
const todayRows = () => readRows(DATE).filter(r => r.date === DATE).length;
// 두 번 뜨면(예약이 겹치거나 앱 재시작 후 다시 실행) 뒤에 뜬 쪽은 바로 끝낸다
const LOCK = path.join(OUT, '.daily.lock');
try { const pid = Number(fs.readFileSync(LOCK, 'utf8')); if (pid && pid !== process.pid) { try { process.kill(pid, 0); log(`이미 실행 중(pid ${pid}) — 종료`); process.exit(0); } catch (_) { /* 죽은 잠금 */ } } } catch (_) { /* 잠금 없음 */ }
fs.writeFileSync(LOCK, String(process.pid));
process.on('exit', () => { try { if (Number(fs.readFileSync(LOCK, 'utf8')) === process.pid) fs.unlinkSync(LOCK); } catch (_) { /* no-op */ } });

const steps = [];
// 1) 캡처(이미 했으면 건너뜀). 하나회원권 캡처 대기 최대 90분 + 측정 1시간 → 넉넉히 160분
if (flag('skip-capture') || todayRows() >= 60) steps.push({ label: 'AI·검색 캡처', ok: true, tail: `오늘 측정 ${todayRows()}행 있음 — 건너뜀` });
else steps.push({ label: 'AI·검색 캡처', ...run('AI·검색 캡처', ['tools/ai-exposure/capture.mjs', '--date', DATE], 160) });
// 2) 블로그 키워드 겹침
const ov = run('블로그 겹침 점검', ['tools/blog/overlap.mjs', '--today', '--save', '--date', DATE], 5); steps.push({ label: '블로그 겹침 점검', ...ov });
// 3) 목요일 주간, 4) 1일 월간(지난달)
const reports = [];
if (weekday(DATE) === '목') { const w = run('주간 리포트', ['tools/ai-exposure/weekly.mjs', DATE], 15); steps.push({ label: '주간 리포트', ...w }); if (w.ok) reports.push(`보고/퀵서비스다_주간리포트_${DATE}.pdf`); }
if (DATE.endsWith('-01')) { const m = addDays(DATE, -1).slice(0, 7); const r = run('월간 리포트', ['tools/ai-exposure/monthly.mjs', '--month', m], 15); steps.push({ label: '월간 리포트', ...r }); if (r.ok) reports.push(`보고/퀵서비스다_월간리포트_${m}.pdf`); }

// 5) 예약 글 공개 확인(읽기만): 어제 18시 이후 ~ 지금 10분 전까지 공개됐어야 할 글이 운영 사이트에서 200인지
const { loadPosts } = await import('../blog/lib.mjs');
const nowK = new Date(Date.now() + 9 * 3600e3); const until = `${nowK.toISOString().slice(0, 10)} ${new Date(nowK.getTime() - 10 * 60e3).toISOString().slice(11, 16)}`;
const due = loadPosts(path.join(REPO, 'content', 'blog')).filter(p => { const at = `${p.date} ${p.time || '00:00'}`; return at > `${addDays(DATE, -1)} 17:59` && at <= until; })
  .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
const pub = [];
for (const p of due) { let code = 0; try { code = (await fetch(`https://xn--2j1bs9sn9b30bc55a.kr/blog/${p.slug}/`, { redirect: 'manual', signal: AbortSignal.timeout(20000) })).status; } catch (_) { /* 연결 실패 = 0 */ } pub.push({ p, code }); }
const pubBad = pub.filter(x => x.code !== 200);
log(`예약 글 공개 확인: ${pub.length}편 중 실패 ${pubBad.length}`);
steps.push({ label: '예약 글 공개 확인', ok: !pubBad.length, tail: pubBad.map(x => `${x.p.date} ${x.p.time} ${x.p.slug} → ${x.code}`).join('\n') });

// 요약: 오늘 결과 + 어제(직전 측정일) 대비(둘 다 유효한 엔진·키워드끼리)
const rows = readRows(DATE); const cell = makeCell(rows);
const dates = [...new Set(rows.map(r => r.date))].sort(); const prev = dates.filter(d => d < DATE).pop();
const today = Object.keys(ENG).flatMap(e => QUERIES.map(q => cell(DATE, e, q))).filter(Boolean);
const siteN = today.filter(r => r.site).length, brandN = today.filter(r => r.brand && !r.site).length;
let cmp = '직전 측정 없음';
if (prev) { let a = 0, b = 0, n = 0; for (const t of today) { const p = cell(prev, t.engine, t.query); if (!p) continue; n++; a += p.site; b += t.site; } cmp = `직전 측정 ${prev} 대비 노출 ${a} → ${b} (공통 ${n}곳)`; }
const hits = today.filter(r => r.site).map(r => `${r.query}/${ENG[r.engine]}`);
const missing = Object.keys(ENG).filter(e => !today.some(r => r.engine === e));
const overlapLine = (ov.out.match(/^전체 글 .*$/m) || [''])[0];
const warn = (ov.out.match(/^\| ⚠ .*$/gm) || []).map(l => l.split('|')[4]?.trim()).filter(Boolean);

const md = [`# 퀵서비스다 일일 점검 — ${DATE}(${weekday(DATE)})`, '',
  `- AI·검색 노출: 유효 ${today.length}곳 · 퀵서비스다.kr 노출 ${siteN} · 상호·번호만 ${brandN} · ${cmp}`,
  `- 노출된 곳: ${hits.join(', ') || '없음'}`,
  `- 미측정 엔진(차단·로그인 필요 등): ${missing.map(e => ENG[e]).join(', ') || '없음'}`,
  `- 블로그 겹침: ${overlapLine || '결과 없음'}${warn.length ? ` · ⚠ ${warn.join(' / ')}` : ' · 오늘·3일 내 예약 글 겹침 없음'}`,
  `- 예약 글 공개: ${pub.length ? pub.map(x => `${x.p.date.slice(5)} ${x.p.time} ${x.code === 200 ? '✅' : '❌' + x.code}`).join(' · ') : '확인할 글 없음'}`,
  `- 리포트: ${reports.join(', ') || '오늘은 없음(주간 목요일, 월간 매월 1일)'}`,
  '', '## 단계별', ...steps.map(s => `- ${s.ok ? '✅' : '❌'} ${s.label}${s.ok ? '' : '\n```\n' + s.tail + '\n```'}`), ''].join('\n');
fs.writeFileSync(path.join(OUT, `${DATE}.md`), md, 'utf8');
log(`요약 저장: 측정/일일/${DATE}.md`);
process.exit(steps.every(s => s.ok) ? 0 : 1);
