// 리포트 공통 차트(SVG·HTML) — highlight.mjs(통합 성과), kwreport.mjs(키워드 노출·문의)
// 규칙: 단일 계열, 0 기준선, 막대 위쪽만 둥글게, 강조 막대만 진하게·값 표시, 격자는 옅게. 색은 사이트 하늘색 한 가지.
import { esc } from './lib.mjs';

export const n = v => Number(v).toLocaleString('ko-KR');

// 세로 막대(날짜별 값 등). data: [[라벨, 값], ...], hi: 값을 표시할 라벨 목록
// w: viewBox 너비 — 반 칸에 넣을 때 320 정도로 줄이면 글자가 작아지지 않는다
export function bars(data, { h = 150, w = 640, unit = '', hi = null, labelEvery = 1, color = '#1e88e5', hiColor = '#0b2545' } = {}) {
  const W = w, padL = 30, padB = 22, padT = 16, cw = W - padL - 6, ch = h - padB - padT;
  const max = Math.max(...data.map(d => d[1]), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max))); const top = Math.ceil(max / step) * step;
  const slot = cw / data.length, bw = Math.max(4, Math.min(26, slot - 4)), r = Math.min(4, bw / 2);
  const y = v => padT + ch - v / top * ch;
  const grid = [0, top / 2, top].map(v => `<line x1="${padL}" x2="${W - 6}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? '#e6edf5' : '#b9c6d4'}" stroke-width="1"/><text x="${padL - 5}" y="${y(v) + 3}" text-anchor="end" font-size="8.5" fill="#5d6b7c">${n(v)}</text>`).join('');
  const marks = data.map(([lab, v], i) => {
    const x = padL + i * slot + (slot - bw) / 2, yy = y(v), isHi = hi && hi.includes(lab);
    const shape = v > 0 ? `<path d="M${x},${y(0)} L${x},${yy + r} Q${x},${yy} ${x + r},${yy} L${x + bw - r},${yy} Q${x + bw},${yy} ${x + bw},${yy + r} L${x + bw},${y(0)} Z" fill="${isHi ? hiColor : color}"/>` : '';
    const val = isHi ? `<text x="${x + bw / 2}" y="${yy - 4}" text-anchor="middle" font-size="9" font-weight="800" fill="#0b2545">${n(v)}${unit}</text>` : '';
    const xl = i % labelEvery === 0 || isHi ? `<text x="${x + bw / 2}" y="${h - 6}" text-anchor="middle" font-size="8" fill="#5d6b7c">${esc(lab)}</text>` : '';
    return shape + val + xl;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${h}" width="100%" role="img" xmlns="http://www.w3.org/2000/svg">${grid}${marks}</svg>`;
}

// 가로 막대 목록(이름 · 막대 · 값). rows: [[이름, 값, 덧붙일 글(선택)], ...]
export const hbars = (rows, color = '#1e88e5') => { const max = Math.max(...rows.map(r => r[1]), 1); return `<div class="hb">${rows.map(([k, v, extra]) => `<div><span>${esc(k)}</span><i><b style="width:${(v / max * 100).toFixed(1)}%;background:${color}"></b></i><em>${n(v)}${extra ? `<small>${esc(extra)}</small>` : ''}</em></div>`).join('')}</div>`; };

// 칸 색 농도(한 가지 색, 옅음 → 진함). ratio 0~1
export const shade = ratio => ratio <= 0 ? '#ffffff' : ['#eaf3fc', '#cfe4f8', '#a9cff2', '#78b4ea', '#4b97df', '#1e6fc0'][Math.min(5, Math.floor(ratio * 6))];
export const inkOn = ratio => ratio >= 4 / 6 ? '#ffffff' : '#0b2545';

export const CHART_CSS = `
.chart{border:1px solid var(--line);border-radius:8px;padding:8px 10px 4px;margin:6px 0;page-break-inside:avoid}.chart h3{margin:0 0 2px}.chart p{margin:0 0 4px}
.hb div{display:grid;grid-template-columns:120px 1fr 64px;gap:8px;align-items:center;font-size:9.2pt;margin:3px 0}.hb i{display:block;height:10px;background:#eef3f8;border-radius:5px;overflow:hidden}.hb b{display:block;height:100%;border-radius:5px}.hb em{font-style:normal;font-weight:800;color:var(--navy);text-align:right}.hb em small{font-weight:400;color:var(--muted);margin-left:3px;font-size:8pt}`;
