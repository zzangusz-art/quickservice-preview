// 재판정 — 판정 규칙(lib.mjs judge)을 고친 뒤, 저장된 캡처 본문(txt)으로 지난 측정을 다시 판정한다(하나회원권 10/12 재판정과 같은 방식).
// result.json·요약 md를 다시 쓰고, 추이.csv의 그 날짜 행을 새 판정으로 바꾼다. 화면을 다시 열지는 않는다.
//   node tools/ai-exposure/rejudge.mjs 2026-10-29 [2026-10-30 …]
import fs from 'node:fs';
import path from 'node:path';
import { AI_DIR, CSV, CSV_HEAD, judge, csvRow, summaryMd, textOf } from './lib.mjs';

const dates = process.argv.slice(2).filter(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
if (!dates.length) { console.error('날짜를 주세요: node tools/ai-exposure/rejudge.mjs YYYY-MM-DD'); process.exit(1); }
let csv = fs.existsSync(CSV) ? fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean) : [CSV_HEAD];
for (const d of dates) {
  const file = path.join(AI_DIR, d, 'result.json');
  if (!fs.existsSync(file)) { console.error('측정 없음:', d); continue; }
  const res = JSON.parse(fs.readFileSync(file, 'utf8'));
  const changes = [];
  for (const r of res) {
    const T = textOf(d, r.engine, r.query);
    if (!T || r.error === '로그인 필요' || r.error === '차단 화면(그날 건너뜀)') continue; // 본문 없는 항목·건너뛴 항목은 그대로
    const before = `${r.site ? '노출' : r.brand ? '언급' : '없음'}${r.error ? '/' + r.error : ''}`;
    const j = judge(r.engine, r.query, T, r.siteLink);
    Object.assign(r, { site: j.site, brand: j.brand, blocked: j.blocked, error: j.error });
    const after = `${r.site ? '노출' : r.brand ? '언급' : '없음'}${r.error ? '/' + r.error : ''}`;
    if (before !== after) changes.push(`${r.engine} | ${r.query}: ${before} → ${after}`);
  }
  fs.writeFileSync(file, JSON.stringify(res, null, 1), 'utf8');
  fs.writeFileSync(path.join(AI_DIR, d, `요약_${d}.md`), summaryMd(d, res), 'utf8');
  csv = csv.filter(l => !l.startsWith(d + ',')).concat(res.map(csvRow));
  console.log(`${d}: ${res.length}건 재판정, 바뀐 것 ${changes.length}건`); for (const c of changes) console.log('  ' + c);
}
const head = csv[0].startsWith('date,') ? csv.shift() : CSV_HEAD;
csv.sort((a, b) => a.slice(0, 10).localeCompare(b.slice(0, 10))); // 날짜 순(같은 날 안의 순서는 유지)
fs.writeFileSync(CSV, '﻿' + [head, ...csv].join('\n') + '\n', 'utf8');
