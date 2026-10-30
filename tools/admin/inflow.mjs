// 유입 경로 판정 — 방문의 첫 페이지 리퍼러·주소 파라미터(UTM·광고 클릭 식별자)·인앱 브라우저로 채널·출처·검색어를 정한다.
// 하나회원권 hana-site/lib/inflow.js 의 규칙을 옮기고 퀵서비스다 출처(기존 .com, 온라인 접수 페이지, 당근, 카카오맵)를 더함.
export const CHANNELS = { organic: '검색(자연)', ai: 'AI 검색·챗봇', social: '블로그·SNS·메신저', paid: '광고', campaign: '캠페인 링크', referral: '외부 사이트', direct: '직접 방문' };
export const CHANNEL_ORDER = ['organic', 'ai', 'social', 'paid', 'campaign', 'referral', 'direct'];

// [호스트 정규식, 표시 이름, 채널, 검색어 파라미터]
const HOSTS = [
  [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)openai\.com$/, 'ChatGPT', 'ai'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity', 'ai'],
  [/^gemini\.google\.com$|^bard\.google\.com$|^aistudio\.google\.com$/, 'Gemini', 'ai'],
  [/^copilot\.microsoft\.com$|^copilot\.com$/, 'Copilot', 'ai'],
  [/(^|\.)claude\.ai$/, 'Claude', 'ai'],
  [/^clova-x\.naver\.com$|^cue\.search\.naver\.com$/, '네이버 AI(클로바X·Cue)', 'ai'],
  [/(^|\.)wrtn\.ai$/, '뤼튼', 'ai'], [/(^|\.)grok\.com$/, 'Grok', 'ai'], [/(^|\.)deepseek\.com$/, 'DeepSeek', 'ai'],
  [/(^|\.)genspark\.ai$/, 'Genspark', 'ai'], [/(^|\.)getliner\.com$|(^|\.)liner\.com$/, 'Liner', 'ai'], [/(^|\.)meta\.ai$/, 'Meta AI', 'ai'],
  [/^(m\.)?blog\.naver\.com$/, '네이버 블로그', 'social'],
  [/^(m\.)?cafe\.naver\.com$/, '네이버 카페', 'social'],
  [/^(m\.)?kin\.naver\.com$/, '네이버 지식iN', 'social'],
  [/^(m\.)?(map|place)\.naver\.com$|^m\.place\.naver\.com$|^pcmap\.place\.naver\.com$|^naver\.me$/, '네이버 지도·플레이스', 'referral'],
  [/^(m\.)?search\.naver\.com$/, '네이버 검색', 'organic', 'query'],
  [/(^|\.)naver\.com$/, '네이버', 'organic', 'query'],
  [/(^|\.)google\.[a-z.]{2,6}$/, '구글 검색', 'organic', 'q'],
  [/(^|\.)bing\.com$/, 'Bing 검색', 'organic', 'q'],
  [/(^|\.)daum\.net$/, '다음 검색', 'organic', 'q'],
  [/(^|\.)zum\.com$/, '줌 검색', 'organic', 'query'],
  [/(^|\.)nate\.com$/, '네이트 검색', 'organic', 'q'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo', 'organic', 'q'],
  [/^(m\.|place\.)?map\.kakao\.com$|^kko\.to$/, '카카오맵', 'referral'],
  [/(^|\.)daangn\.com$/, '당근', 'social'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, '유튜브', 'social'],
  [/(^|\.)instagram\.com$/, '인스타그램', 'social'],
  [/(^|\.)facebook\.com$|^fb\.me$/, '페이스북', 'social'],
  [/(^|\.)threads\.(net|com)$/, '스레드', 'social'],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, 'X(트위터)', 'social'],
  [/(^|\.)kakao\.com$|(^|\.)kakaocorp\.com$/, '카카오톡·카카오 채널', 'social'],
  [/(^|\.)tistory\.com$/, '티스토리', 'social'],
  [/(^|\.)band\.us$/, '네이버 밴드', 'social'],
  [/(^|\.)xn--2j1bs9sn9b30bc55a\.com$|(^|\.)퀵서비스다\.com$/, '기존 홈페이지(퀵서비스다.com)', 'referral'],
  [/(^|\.)1661-7462\.com$/, '온라인 접수 페이지(1661-7462.com)', 'referral'],
];
const UTM_NAMES = { naver: '네이버', naver_blog: '네이버 블로그', naverblog: '네이버 블로그', blog: '네이버 블로그', naver_cafe: '네이버 카페', naver_place: '네이버 플레이스', google: '구글', kakao: '카카오톡·카카오 채널', kakaotalk: '카카오톡·카카오 채널', daangn: '당근', instagram: '인스타그램', youtube: '유튜브', facebook: '페이스북', sms: '문자', qr: 'QR 코드' };

const clip = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const hostRule = (host) => HOSTS.find(r => r[0].test(host)) || null;
const parseUrl = (s) => { try { if (!s) return null; const u = new URL(s); return /^https?:$/.test(u.protocol) ? u : null; } catch (_) { return null; } };

// referer: 첫 페이지의 document.referrer, search: 첫 페이지 주소의 ?쿼리, ownHosts: 사이트 안 이동으로 볼 호스트
export function detect({ referer = '', search = '', ua = '', ownHosts = [] } = {}) {
  const qs = new URLSearchParams(String(search).replace(/^\?/, ''));
  const q = (k) => clip(qs.get(k), 120);
  const out = { channel: 'direct', source: '직접 방문', medium: '', campaign: '', keyword: '', refHost: '' };
  const u = parseUrl(referer);
  let host = u ? u.hostname.toLowerCase().replace(/^www\./, '') : '';
  if (host && ownHosts.includes(host)) host = '';
  const rule = host ? hostRule(host) : null;
  if (host) {
    out.refHost = clip(host, 80);
    if (rule) { out.channel = rule[2]; out.source = rule[1]; if (rule[3]) out.keyword = clip(u.searchParams.get(rule[3]) || '', 80); }
    else { out.channel = 'referral'; out.source = host; }
  } else if (/KAKAOTALK/i.test(ua)) { out.channel = 'social'; out.source = '카카오톡·카카오 채널'; out.medium = 'inapp'; }
  else if (/NAVER\(inapp/i.test(ua)) { out.channel = 'organic'; out.source = '네이버'; out.medium = 'inapp'; }
  else if (/Instagram/i.test(ua)) { out.channel = 'social'; out.source = '인스타그램'; out.medium = 'inapp'; }
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) { out.channel = 'social'; out.source = '페이스북'; out.medium = 'inapp'; }
  if (q('gclid') || q('gbraid') || q('wbraid')) { out.channel = 'paid'; out.source = '구글 광고'; out.medium = 'cpc'; }
  if (q('n_media') || q('n_query') || q('n_keyword') || q('n_ad')) { out.channel = 'paid'; out.source = '네이버 광고'; out.medium = 'cpc'; out.keyword = q('n_query') || q('n_keyword') || out.keyword; }
  if (q('fbclid') && out.channel === 'direct') { out.channel = 'social'; out.source = '페이스북'; }
  const us = q('utm_source').toLowerCase();
  if (us) {
    out.medium = q('utm_medium').toLowerCase(); out.campaign = q('utm_campaign');
    if (q('utm_term') && !out.keyword) out.keyword = q('utm_term');
    const asHost = hostRule(us.replace(/^www\./, ''));
    if (asHost) { out.source = asHost[1]; out.channel = asHost[2]; } else out.source = UTM_NAMES[us] || us; // utm_source=chatgpt.com 같은 AI 출처도 잡힘
    const m = out.medium;
    if (/^(cpc|ppc|paid|ad|ads|da|display|banner|sa|powerlink|brandsearch)/.test(m)) out.channel = 'paid';
    else if (/^(social|sns|blog|cafe|community|messenger|kakao|video)/.test(m)) out.channel = 'social';
    else if (/^(organic|search)/.test(m)) out.channel = 'organic';
    else if (/^(ai|llm|chatbot)/.test(m)) out.channel = 'ai';
    else if (!asHost) out.channel = 'campaign';
  }
  return out;
}
export const device = (ua = '') => /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone|iPod/i.test(ua) ? 'mobile' : 'desktop';
export const isBot = (ua = '') => !/^Mozilla\//.test(ua) || /bot|crawl|spider|slurp|headless|lighthouse|preview|phantom|python|curl|wget|httpclient|monitor/i.test(ua);
