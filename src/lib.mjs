// 공용 도우미
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './data.mjs';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const won = n => Number(n).toLocaleString('ko-KR') + '원';
export const nl2br = s => esc(s).replace(/\n/g, '<br>');

// 페이지 출력 경로(예: services/motorcycle/index.html) 기준 상대 경로
export function makeUrl(outPath) {
  const depth = outPath.split('/').length - 1;
  const prefix = depth ? '../'.repeat(depth) : './';
  return to => {
    if (/^(https?:|mailto:|tel:|sms:|#|\/\/)/.test(to)) return to;
    const p = to.replace(/^\//, '');
    return p === '' ? prefix : prefix + p;
  };
}
// 출력 경로 → 공개 주소
export const pageUrl = outPath => SITE.url + outPath.replace(/index\.html$/, '');

export const jsonld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// 금액 표시: 8,000원~
export const from = n => `${won(n)}~`;

export const kdate = d => { const [y, m, dd] = d.split('-'); return `${y}.${m}.${dd}`; };

// ── 사진: assets/img/<dir>/<file> 의 실제 크기를 읽어 width·height를 붙인다(레이아웃 흔들림 방지) ──
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sizeCache = new Map();
export function webpSize(rel) {
  if (sizeCache.has(rel)) return sizeCache.get(rel);
  const b = fs.readFileSync(path.join(ROOT, rel));
  const fmt = b.toString('ascii', 12, 16);
  let wh;
  if (fmt === 'VP8 ') wh = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  else if (fmt === 'VP8L') wh = [1 + (((b[22] & 0x3f) << 8) | b[21]), 1 + (((b[24] & 0xf) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6))];
  else if (fmt === 'VP8X') wh = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  else throw new Error('WebP 크기를 읽지 못함: ' + rel);
  sizeCache.set(rel, wh);
  return wh;
}
// u: 상대 경로 함수, file: assets/img/photo/ 기준 파일명 또는 assets/ 부터의 경로
export function photo(u, file, alt, { cls = '', lazy = true, priority = false } = {}) {
  const rel = file.startsWith('assets/') ? file : 'assets/img/photo/' + file;
  const [w, h] = webpSize(rel);
  return `<img src="${u(rel)}" alt="${esc(alt)}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ''}${lazy && !priority ? ' loading="lazy"' : ''} decoding="async"${priority ? ' fetchpriority="high"' : ''}>`;
}
