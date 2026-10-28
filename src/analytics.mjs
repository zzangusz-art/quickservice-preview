// 방문 분석 태그: GA4(gtag)·Google 태그 관리자(GTM)·네이버 애널리틱스·Microsoft Clarity.
// SITE.analytics에 형식이 맞는 ID만 넣고, 운영 빌드에서만 켠다(setTracking).
// 실제로 불러오는 건 대표 주소(퀵서비스다.kr)로 접속했을 때뿐이다 — Railway 기본 주소·로컬 확인·미리보기 방문은 집계하지 않는다.
// (다른 주소에서 태그를 시험하려면 주소 뒤에 ?qs_track=1)
// 이벤트는 assets/js/app.js의 「방문 분석 이벤트」가 보낸다.
import { SITE } from './data.mjs';

const A = SITE.analytics || {};
const valid = { ga4: /^G-[A-Z0-9]{4,}$/, gtm: /^GTM-[A-Z0-9]{4,}$/, naver: /^[a-z0-9]{6,}$/i, clarity: /^[a-z0-9]{6,}$/i };
const ids = Object.fromEntries(Object.entries(valid).map(([k, re]) => [k, re.test(A[k] || '') ? A[k] : '']));
let on = false;
export const setTracking = v => { on = !!v; };
export const trackingTools = () => (on ? Object.keys(ids).filter(k => ids[k]) : []);

export function analyticsHead() {
  if (!trackingTools().length) return '';
  const host = new URL(SITE.url).hostname;
  return `<script>(function(w,d,ids,host){if(location.hostname!==host&&!/[?&]qs_track=1/.test(location.search))return;
w.QS_ANALYTICS=ids;w.dataLayer=w.dataLayer||[];w.gtag=function(){dataLayer.push(arguments)};
function add(src,end){var s=d.createElement('script');s.async=true;s.src=src;(end?d.body:d.head).appendChild(s);return s}
if(ids.gtm){dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});add('https://www.googletagmanager.com/gtm.js?id='+ids.gtm)}
if(ids.ga4){gtag('js',new Date());gtag('config',ids.ga4);add('https://www.googletagmanager.com/gtag/js?id='+ids.ga4)}
if(ids.clarity){w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};add('https://www.clarity.ms/tag/'+ids.clarity)}
if(ids.naver){w.wcs_add=w.wcs_add||{};wcs_add.wa=ids.naver;w.addEventListener('load',function(){add('https://wcs.naver.net/wcslog.js',1).onload=function(){if(w.wcs){if(wcs.inflow)wcs.inflow(host);wcs_do()}}})}
})(window,document,${JSON.stringify(ids)},${JSON.stringify(host)});</script>\n`;
}

export function analyticsBodyTop() {
  return on && ids.gtm ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${ids.gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n` : '';
}
