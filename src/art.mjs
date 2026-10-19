// SVG 그림: 아이콘 스프라이트, 차량 측면도(실제 적재함 길이 비율), 전국 연계 지도, 관제 화면
import { CITIES } from './data.mjs';

// ── 아이콘 (24×24, 선 아이콘) ───────────────────────────
const I = {
  phone: '<path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5Z"/>',
  chat: '<path d="M12 4C7 4 3 7.1 3 11c0 2.4 1.5 4.5 3.9 5.8L6 20.5l4.1-2.6c.6.1 1.2.1 1.9.1 5 0 9-3.1 9-7s-4-7-9-7Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  out: '<path d="M7 17 17 7M9 7h8v8"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.3"/>',
  moto: '<circle cx="6" cy="16.5" r="3"/><circle cx="18" cy="16.5" r="3"/><path d="M6 16.5h5l3-6h3l1 6M14 10.5 12.5 7H10M15.5 7h2"/><rect x="3.5" y="8" width="5" height="4" rx=".6"/>',
  van: '<path d="M2.5 16.5V9.2c0-1.2 1-2.2 2.2-2.2h9.6l4.2 4.3 2.5.8v4.4h-2"/><path d="M14 7v4.5h4.5"/><circle cx="7" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9 17h5.5"/>',
  truck: '<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  rail: '<rect x="5.5" y="3.5" width="13" height="13" rx="3"/><path d="M5.5 10.5h13M9 20.5l1.5-4M15 20.5l-1.5-4"/><circle cx="9" cy="13.5" r=".8"/><circle cx="15" cy="13.5" r=".8"/>',
  bus: '<rect x="4.5" y="3.5" width="15" height="14" rx="2.5"/><path d="M4.5 11h15M7.5 20.5v-3M16.5 20.5v-3"/><circle cx="8" cy="14.3" r=".8"/><circle cx="16" cy="14.3" r=".8"/>',
  plane: '<path d="M10.5 3.8c0-.9.7-1.6 1.5-1.6s1.5.7 1.5 1.6V9l7 4v2l-7-2v4.5l2.2 1.6V20L12 19.2 8.3 20v-1.9l2.2-1.6V13l-7 2v-2l7-4Z"/>',
  box: '<path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
  receipt: '<path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.4z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  building: '<path d="M4.5 20.5v-15l8-2.5v17.5M12.5 8.5h7v12M3 20.5h18M7.5 8.5h2M7.5 12h2M7.5 15.5h2M15.5 12h1.5M15.5 15.5h1.5"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
  quote: '<path d="M10 7H6.5A1.5 1.5 0 0 0 5 8.5V12h4.5v5L13 12V8.5A1.5 1.5 0 0 0 11.5 7Z" transform="translate(-1.5 0)"/><path d="M19.5 7H16a1.5 1.5 0 0 0-1.5 1.5V12H19v5l3.5-5V8.5A1.5 1.5 0 0 0 21 7Z" transform="translate(-1.5 0)"/>',
  weight: '<path d="M6.5 8.5h11l2.5 12h-16Z"/><circle cx="12" cy="5.5" r="2.5"/>',
  ruler: '<path d="m3.5 15.5 12-12 5 5-12 12Z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>',
  lift: '<path d="M3 15.5h12v-9H3zM15 10.5h3.5l2.5 3v2h-6M15 18.5h6"/><circle cx="6.5" cy="17.5" r="1.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  wallet: '<path d="M4 7.5a2 2 0 0 1 2-2h12v3"/><rect x="4" y="8.5" width="16.5" height="11" rx="2"/><path d="M16 14h1.5"/>',
  online: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20M7.5 10.5l2.5 2.5 5-5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  play: '<path d="M8 5.5v13l10-6.5Z"/>',
  top: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
};
export function sprite() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.entries(I).map(([k, v]) =>
    `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('')}</defs></svg>`;
}
export const ico = (k, cls = '') => `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${k}"/></svg>`;

// ── 차량 측면도 ───────────────────────────────────────
// 단위 cm, 지면 y=0, 위쪽이 음수. viewBox도 cm로 잡아 같은 배율이면 실제 비율로 보인다.
const wheel = (x, r) => `<g class="v-wheel"><circle cx="${x}" cy="${-r}" r="${r}"/><circle class="v-hub" cx="${x}" cy="${-r}" r="${r * 0.42}"/></g>`;

function truckSVG({ cargoLen, deck, boxH = 0, kind = 'cargo', big = false, axles = 1, frontAxles = 1 }) {
  const cabL = big ? 230 : 165, cabH = big ? 300 : 205, r = big ? 52 : 34;
  const gap = 12, x0 = 10;
  const cabX = x0, cargoX = x0 + cabL + gap, total = cargoX + cargoLen + 20;
  const chassisY = -(r * 1.55);
  const parts = [];
  // 샤시
  parts.push(`<rect class="v-chassis" x="${cabX + 20}" y="${chassisY}" width="${cargoX + cargoLen - cabX - 30}" height="${r * 0.42}" rx="4"/>`);
  // 캡(캡오버형)
  const cy = -cabH;
  parts.push(`<path class="v-body" d="M${cabX} ${chassisY + 6} V${cy + 40} Q${cabX} ${cy} ${cabX + 40} ${cy} H${cabX + cabL - 8} Q${cabX + cabL} ${cy} ${cabX + cabL} ${cy + 10} V${chassisY + 6} Z"/>`);
  parts.push(`<path class="v-glass" d="M${cabX + 6} ${cy + 46} Q${cabX + 8} ${cy + 14} ${cabX + 40} ${cy + 14} H${cabX + cabL * 0.62} V${cy + cabH * 0.42} H${cabX + 6} Z"/>`);
  parts.push(`<rect class="v-accent" x="${cabX}" y="${chassisY - 26}" width="${cabL}" height="10"/>`);
  parts.push(`<rect class="v-light" x="${cabX - 2}" y="${chassisY - 6}" width="12" height="10" rx="2"/>`);
  // 적재함
  const deckY = -deck;
  if (kind === 'cargo') {
    parts.push(`<rect class="v-bed" x="${cargoX}" y="${deckY - 12}" width="${cargoLen}" height="14"/>`);
    parts.push(`<rect class="v-rail" x="${cargoX}" y="${deckY - 52}" width="${cargoLen}" height="40" rx="3"/>`);
    const n = Math.max(2, Math.round(cargoLen / 120));
    for (let i = 1; i < n; i++) parts.push(`<rect class="v-line" x="${cargoX + (cargoLen / n) * i - 2}" y="${deckY - 52}" width="4" height="40"/>`);
  } else {
    parts.push(`<rect class="v-bed" x="${cargoX}" y="${deckY - 12}" width="${cargoLen}" height="14"/>`);
    parts.push(`<rect class="v-box${kind === 'cold' ? ' v-box-cold' : ''}" x="${cargoX}" y="${deckY - 12 - boxH}" width="${cargoLen}" height="${boxH}" rx="6"/>`);
    if (kind === 'wing') parts.push(`<path class="v-line" d="M${cargoX + 6} ${deckY - 12 - boxH + 8} H${cargoX + cargoLen - 6}" stroke-width="5" fill="none"/>`);
    parts.push(`<rect class="v-stripe" x="${cargoX}" y="${deckY - 12 - boxH * 0.42}" width="${cargoLen}" height="${Math.max(10, boxH * 0.08)}"/>`);
  }
  // 바퀴
  const fx = cabX + cabL * 0.48;
  parts.push(wheel(fx, r));
  if (frontAxles > 1) parts.push(wheel(fx + r * 2.3, r));
  const rx = cargoX + cargoLen * 0.72;
  for (let i = 0; i < axles; i++) parts.push(wheel(rx - (axles - 1) * r * 1.15 + i * r * 2.3, r));
  const top = Math.min(cy, deckY - 12 - boxH, deckY - 52) - 10;
  return { svg: parts.join(''), w: total, h: -top + 4, top };
}

function motoSVG() {
  const r = 28;
  const p = [
    wheel(32, r), wheel(158, r),
    `<path class="v-body" d="M40 -60 L70 -92 H118 L142 -64 L170 -66 L160 -44 H52 Z"/>`,
    `<rect class="v-box" x="24" y="-142" width="58" height="52" rx="6"/>`,
    `<rect class="v-stripe" x="24" y="-122" width="58" height="8"/>`,
    `<path class="v-dark" d="M78 -100 H122 L118 -92 H76 Z"/>`,
    `<path class="v-line" d="M138 -66 L150 -118 M142 -118 H164" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    `<rect class="v-light" x="156" y="-104" width="12" height="9" rx="2"/>`,
  ];
  return { svg: p.join(''), w: 192, h: 148, top: -146 };
}
function damasSVG() {
  const r = 26;
  const p = [
    `<path class="v-body" d="M10 -38 V-150 Q12 -186 52 -188 H262 Q296 -186 312 -150 L336 -98 Q344 -86 344 -64 V-38 Z"/>`,
    `<path class="v-glass" d="M254 -176 H268 Q290 -172 302 -146 L320 -104 H254 Z"/>`,
    `<path class="v-glass" d="M150 -176 H240 V-104 H150 Z"/>`,
    `<path class="v-glass" d="M26 -168 Q30 -176 48 -176 H136 V-104 H26 Z"/>`,
    `<rect class="v-stripe" x="10" y="-84" width="334" height="9"/>`,
    `<rect class="v-light" x="334" y="-70" width="10" height="12" rx="2"/>`,
    wheel(76, r), wheel(276, r),
  ];
  return { svg: p.join(''), w: 352, h: 194, top: -192 };
}
function laboSVG() {
  const r = 26;
  const p = [
    `<rect class="v-chassis" x="20" y="-56" width="320" height="14" rx="4"/>`,
    `<path class="v-body" d="M222 -46 V-150 Q224 -180 256 -182 H300 Q322 -180 332 -150 L342 -98 Q346 -86 346 -64 V-46 Z"/>`,
    `<path class="v-glass" d="M234 -168 Q238 -172 256 -172 H296 Q312 -170 320 -146 L330 -108 H234 Z"/>`,
    `<rect class="v-bed" x="12" y="-74" width="204" height="16"/>`,
    `<rect class="v-rail" x="12" y="-112" width="204" height="38" rx="3"/>`,
    `<rect class="v-line" x="78" y="-112" width="4" height="38"/><rect class="v-line" x="146" y="-112" width="4" height="38"/>`,
    `<rect class="v-light" x="336" y="-70" width="10" height="12" rx="2"/>`,
    wheel(70, r), wheel(290, r),
  ];
  return { svg: p.join(''), w: 352, h: 188, top: -186 };
}

export const VEHICLE_ART = {
  moto: motoSVG,
  damas: damasSVG,
  labo: laboSVG,
  t1: () => truckSVG({ cargoLen: 280, deck: 80, kind: 'cargo' }),
  t1top: () => truckSVG({ cargoLen: 280, deck: 80, boxH: 170, kind: 'top' }),
  t14: () => truckSVG({ cargoLen: 300, deck: 75, kind: 'cargo' }),
  t25: () => truckSVG({ cargoLen: 430, deck: 100, boxH: 190, kind: 'wing', big: true }),
  t35: () => truckSVG({ cargoLen: 460, deck: 105, boxH: 190, kind: 'top', big: true }),
  t5: () => truckSVG({ cargoLen: 620, deck: 115, boxH: 205, kind: 'wing', big: true }),
  t5p: () => truckSVG({ cargoLen: 765, deck: 115, kind: 'cargo', big: true, axles: 2 }),
  t11: () => truckSVG({ cargoLen: 900, deck: 135, boxH: 225, kind: 'wing', big: true, axles: 2 }),
  t25t: () => truckSVG({ cargoLen: 1010, deck: 140, boxH: 250, kind: 'wing', big: true, axles: 2, frontAxles: 2 }),
  cold: () => truckSVG({ cargoLen: 430, deck: 100, boxH: 190, kind: 'cold', big: true }),
};

// scale: 1cm 당 px. fixedH를 주면 높이를 맞춘다(아이콘처럼 쓸 때)
export function vehicle(id, { scale = 0.3, label = '', cls = '' } = {}) {
  const v = VEHICLE_ART[id]();
  const vbH = 420; // 모든 차량 같은 높이 기준(가장 큰 트럭 ~410cm)
  return `<svg class="veh${cls ? ' ' + cls : ''}" viewBox="0 ${-vbH} ${v.w} ${vbH + 2}" width="${Math.round(v.w * scale)}" height="${Math.round((vbH + 2) * scale)}" role="img" aria-label="${label}"><line class="v-ground" x1="0" y1="0" x2="${v.w}" y2="0"/>${v.svg}</svg>`;
}
// 카드용: 차량 크기에 맞춰 viewBox를 자른다
export function vehicleFit(id, label = '') {
  const v = VEHICLE_ART[id]();
  return `<svg class="veh veh-fit" viewBox="0 ${v.top - 6} ${v.w} ${-v.top + 10}" role="img" aria-label="${label}"><line class="v-ground" x1="0" y1="0" x2="${v.w}" y2="0"/>${v.svg}</svg>`;
}

// ── 대한민국 지도(단순 해안선) + 연계 노선 ────────────────────
const COAST = [
  [126.62, 37.78], [126.55, 37.62], [126.6, 37.48], [126.7, 37.3], [126.8, 37.15], [126.62, 37.0], [126.4, 36.98], [126.12, 36.85],
  [126.35, 36.6], [126.5, 36.35], [126.62, 36.05], [126.7, 35.95], [126.48, 35.65], [126.5, 35.45], [126.4, 35.25], [126.38, 35.0],
  [126.3, 34.8], [126.42, 34.55], [126.52, 34.3], [126.85, 34.45], [127.15, 34.55], [127.35, 34.48], [127.62, 34.7], [127.85, 34.88],
  [128.05, 34.85], [128.4, 34.85], [128.62, 34.92], [128.8, 35.1], [129.05, 35.05], [129.22, 35.18], [129.32, 35.4], [129.43, 35.55],
  [129.48, 35.85], [129.58, 36.05], [129.4, 36.15], [129.42, 36.45], [129.43, 36.8], [129.4, 37.05], [129.22, 37.35], [129.1, 37.55],
  [128.92, 37.78], [128.7, 38.05], [128.58, 38.22], [128.4, 38.55], [128.3, 38.62], [127.9, 38.32], [127.5, 38.3], [127.15, 38.25],
  [126.95, 38.05], [126.75, 37.92],
];
const px = (lon, lat) => [Math.round((lon - 125.85) * 100), Math.round((38.8 - lat) * 122)];
export function koreaMap(intercity) {
  const d = 'M' + COAST.map(([a, b]) => px(a, b).join(' ')).join(' L') + ' Z';
  const [jx, jy] = px(126.55, 33.38);
  const [sx, sy] = px(CITIES.seoul.lon, CITIES.seoul.lat);
  const used = new Set(intercity.flatMap(m => m.cities));
  const routes = intercity.flatMap(m => m.cities.map(c => {
    const [x, y] = px(CITIES[c].lon, CITIES[c].lat);
    const mx = (sx + x) / 2 + (m.id === 'air' ? 70 : m.id === 'bus' ? -40 : 30), my = (sy + y) / 2 - (m.id === 'air' ? 30 : 0);
    return `<path class="km-route km-${m.id}" data-mode="${m.id}" d="M${sx} ${sy} Q${mx} ${my} ${x} ${y}" pathLength="1"/>`;
  })).join('');
  const dots = [...used].map(c => {
    const [x, y] = px(CITIES[c].lon, CITIES[c].lat);
    const modes = intercity.filter(m => m.cities.includes(c)).map(m => m.id).join(' ');
    const right = CITIES[c].lon > 128.4 || c === 'jeju';
    return `<g class="km-city" data-modes="${modes}"><circle cx="${x}" cy="${y}" r="6"/><text x="${x + (right ? -10 : 10)}" y="${y + 4}" text-anchor="${right ? 'end' : 'start'}">${CITIES[c].name}</text></g>`;
  }).join('');
  return `<svg class="kmap" viewBox="0 0 400 720" role="img" aria-label="서울·경기에서 지방 주요 도시로 가는 KTX·고속버스·항공 연계 노선도">
<path class="km-land" d="${d}"/><ellipse class="km-land" cx="${jx}" cy="${jy}" rx="40" ry="20"/>
${routes}
<g class="km-hub"><circle cx="${sx}" cy="${sy}" r="16" class="km-pulse"/><circle cx="${sx}" cy="${sy}" r="8"/><text x="${sx + 14}" y="${sy - 12}">서울·경기</text></g>
${dots}</svg>`;
}

// ── 관제 화면(스크롤 시퀀스용): 도로망 + 경로 ────────────────
export function consoleMap() {
  const roads = [];
  for (let i = 0; i < 9; i++) roads.push(`<path d="M${-20 + i * 70} -10 L${30 + i * 62} 410"/>`);
  for (let j = 0; j < 7; j++) roads.push(`<path d="M-10 ${20 + j * 64} L620 ${-10 + j * 70}"/>`);
  return `<svg class="cm-svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<rect class="cm-bg" width="600" height="400"/>
<path class="cm-river" d="M-20 250 C 90 210, 160 300, 270 262 S 450 190, 620 230"/>
<g class="cm-roads">${roads.join('')}</g>
<path class="cm-arterial" d="M40 360 C 140 330, 170 260, 250 240 S 380 150, 560 60"/>
<path class="cm-route-base" id="cmRouteBase" d="M78 330 C 150 300, 175 250, 250 236 S 360 170, 420 150 S 500 110, 528 84"/>
<path class="cm-route" id="cmRoute" d="M78 330 C 150 300, 175 250, 250 236 S 360 170, 420 150 S 500 110, 528 84"/>
<g class="cm-node cm-a"><circle cx="78" cy="330" r="16"/><circle cx="78" cy="330" r="6"/></g>
<g class="cm-node cm-b"><circle cx="528" cy="84" r="16"/><circle cx="528" cy="84" r="6"/></g>
<g class="cm-cars"><circle cx="140" cy="120" r="4"/><circle cx="330" cy="320" r="4"/><circle cx="470" cy="260" r="4"/><circle cx="215" cy="60" r="4"/><circle cx="560" cy="190" r="4"/><circle cx="60" cy="210" r="4"/></g>
<g class="cm-vehicle" id="cmVehicle"><circle r="13"/><circle r="5"/></g>
</svg>`;
}
