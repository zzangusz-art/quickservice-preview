// 키워드 × 엔진 노출 집계(측정/AI검색/추이.csv)와 상호·번호 언급 추이(측정/일일/*.md) — kwreport.mjs·status.mjs가 함께 씀
import fs from 'node:fs';
import path from 'node:path';
import { PROJ, esc } from './lib.mjs';
import { shade, inkOn } from './charts.mjs';

export const ENGINES = [['naver', '네이버'], ['naverai', '네이버 AI'], ['google', '구글'], ['bing', 'Bing'], ['chatgpt', 'ChatGPT'], ['gemini', 'Gemini'], ['perplexity', 'Perplexity'], ['claude', 'Claude']];

const csvRows = text => text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map(line => {
  const out = []; let cur = '', q = false;
  for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out;
});

// toDate까지의 매일 측정 → 키워드별 엔진 칸(유효 측정 수·.kr 링크 날·상호 언급 날)
export function loadMatrix(toDate) {
  const [head, ...body] = csvRows(fs.readFileSync(path.join(PROJ, '측정', 'AI검색', '추이.csv'), 'utf8'));
  const col = k => head.indexOf(k);
  const TR = body.map(r => ({ date: r[col('date')], engine: r[col('engine')], query: r[col('query')], site: r[col('site')] === '1', brand: r[col('brand')] === '1', ok: r[col('blocked')] !== '1' && !r[col('error')] }))
    .filter(r => r.date <= toDate);
  const QUERIES = [...new Set(TR.map(r => r.query))];
  const DATES = [...new Set(TR.map(r => r.date))].sort();
  const cell = (q, e) => {
    const rs = TR.filter(r => r.query === q && r.engine === e && r.ok);
    return { valid: rs.length, site: rs.filter(r => r.site).length, brand: rs.filter(r => r.brand || r.site).length };
  };
  const MATRIX = QUERIES.map(q => {
    const cells = ENGINES.map(([e]) => cell(q, e));
    return { q, cells, brand: cells.reduce((a, c) => a + c.brand, 0), site: cells.reduce((a, c) => a + c.site, 0), engines: cells.filter(c => c.brand).length };
  }).sort((a, b) => b.site - a.site || b.brand - a.brand);
  return {
    TR, DATES, MATRIX,
    mentionedKw: MATRIX.filter(m => m.brand > 0),
    siteKw: MATRIX.filter(m => m.site > 0),
    naverSite: MATRIX.reduce((a, m) => a + m.cells[0].site, 0),
    lastSiteDay: TR.filter(r => r.site).map(r => r.date).sort().pop(),
    // .kr 링크가 나온 (날짜, 엔진, 키워드)
    siteHits: TR.filter(r => r.site && r.ok).map(r => ({ date: r.date, engine: r.engine, query: r.query })),
  };
}

// 일일 점검 첫 줄의 「유효 N곳 · .kr 노출 N · 상호·번호만 N」
export function loadMentions(toDate) {
  const DAILY = path.join(PROJ, '측정', '일일');
  return fs.readdirSync(DAILY).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f) && f.slice(0, 10) <= toDate).sort().map(f => {
    const l = (fs.readFileSync(path.join(DAILY, f), 'utf8').match(/AI·검색 노출:[^\n]*/) || [''])[0];
    const num = re => +((l.match(re) || [])[1] || 0);
    return { d: f.slice(5, 10), date: f.slice(0, 10), valid: num(/유효 (\d+)곳/), brand: num(/상호·번호만 (\d+)/), site: num(/\.kr 노출 (\d+)/) };
  }).filter(x => x.valid > 0);
}

// 키워드 × 엔진 표. 칸 농도는 전체 측정 횟수 대비(한두 번만 잰 엔진이 진하게 보이지 않게), ●는 .kr 링크가 나온 날 수
export function heatTable({ MATRIX, DATES }) {
  const engHead = ENGINES.map(([, l]) => `<th class="c">${l}</th>`).join('');
  const rows = MATRIX.map(m => `<tr><td><b>${esc(m.q)}</b></td>${m.cells.map(c => {
    if (!c.valid) return '<td class="c muted">·</td>';
    const ratio = c.brand / DATES.length;
    return `<td class="c" style="background:${shade(ratio)};color:${inkOn(ratio)}">${c.brand ? c.brand : '<span class="muted">0</span>'}${c.site ? ` <span class="kr">●${c.site}</span>` : ''}</td>`;
  }).join('')}<td class="c"><b>${m.brand}</b></td></tr>`).join('');
  const validRow = `<tr class="vr"><td>측정된 날(평균)</td>${ENGINES.map((_, i) => `<td class="c">${Math.round(MATRIX.reduce((a, m) => a + m.cells[i].valid, 0) / MATRIX.length)}</td>`).join('')}<td></td></tr>`;
  return `<table class="heat"><tr><th>키워드</th>${engHead}<th class="c">합계</th></tr>${rows}${validRow}</table>`;
}

export const HEAT_CSS = `.heat td,.heat th{padding:3px 4px;font-size:8.8pt}.heat td:first-child{white-space:nowrap}.heat .kr{display:inline-block;background:#fff;color:#0a7a3e;border:1px solid #9fd8b8;border-radius:7px;padding:0 4px;font-weight:800;font-size:7.5pt;line-height:1.3}.heat .vr td{background:#f6f8fb;color:var(--muted);font-size:8pt}`;
