// 공용 도우미
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
