// "보내는 과정" 내비 화면에 쓸 실제 도로 경로를 받아 assets/data/route.json 으로 저장한다(한 번만 돌리면 됨).
//   node tools/fetch_route.mjs
// 경로: OSRM 공개 서버(OpenStreetMap 도로 데이터). 출발 장안동(천호대로 391 부근) → 도착 역삼동(역삼역 부근). 예시 화면용.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FROM = { name: '장안동', lng: 127.0662, lat: 37.5663 };
const TO = { name: '역삼동', lng: 127.0364, lat: 37.5006 };
const url = `https://router.project-osrm.org/route/v1/driving/${FROM.lng},${FROM.lat};${TO.lng},${TO.lat}?overview=full&geometries=geojson&steps=true`;

const res = await fetch(url, { headers: { 'User-Agent': 'quickservice-site route snapshot' } });
if (!res.ok) throw new Error('경로 요청 실패 ' + res.status);
const r = (await res.json()).routes[0];
const coords = r.geometry.coordinates.map(([x, y]) => [+x.toFixed(6), +y.toFixed(6)]);

// 점마다 출발점부터의 누적 거리(m)
const R = 6371008.8, rad = d => d * Math.PI / 180;
const hav = (a, b) => { const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const cum = [0];
for (let i = 1; i < coords.length; i++) cum.push(+(cum[i - 1] + hav(coords[i - 1], coords[i])).toFixed(1));

// 회전 안내 문구(한국어)
const turnWord = m => ({ left: '좌회전', right: '우회전', 'slight left': '왼쪽 방향', 'slight right': '오른쪽 방향', 'sharp left': '좌회전', 'sharp right': '우회전', straight: '직진', uturn: 'U턴' }[m] || '직진');
function say(s) {
  const t = s.maneuver.type, m = s.maneuver.modifier || 'straight', name = s.name || '';
  if (t === 'arrive') return { text: '목적지 도착', icon: 'arrive' };
  if (t === 'on ramp') return { text: `${name ? name + ' ' : ''}진입로로 진입`, icon: m };
  if (t === 'off ramp') return { text: `${name ? name + ' 방면 ' : ''}출구로 나가기`, icon: m };
  if (t === 'merge') return { text: `${name ? name + '에 ' : ''}합류`, icon: m };
  if (t === 'fork') return { text: `${m.includes('left') ? '왼쪽' : '오른쪽'} 길로${name ? ' · ' + name : ''}`, icon: m };
  if (t === 'new name' || (t === 'continue' && m === 'straight')) return { text: `${name ? name + ' 따라 ' : ''}직진`, icon: 'straight' };
  return { text: `${name ? name + ' 방면 ' : ''}${turnWord(m)}`, icon: m };
}
// 안내 지점을 경로 좌표 번호로 바꾼다(가장 가까운 점)
const nearest = loc => { let bi = 0, bd = Infinity; coords.forEach((c, i) => { const d = hav(c, loc); if (d < bd) { bd = d; bi = i; } }); return bi; };
const steps = r.legs[0].steps.filter(s => s.maneuver.type !== 'depart').map(s => {
  const i = nearest(s.maneuver.location);
  return { at: cum[i], road: s.name || '', ...say(s) };
});

const out = {
  source: 'OSRM(router.project-osrm.org) · © OpenStreetMap contributors',
  fetched: new Date().toISOString().slice(0, 10),
  from: FROM, to: TO,
  distance: Math.round(r.distance), duration: Math.round(r.duration),
  firstRoad: r.legs[0].steps[0].name || '',
  coords, cum, steps,
};
fs.mkdirSync(path.join(ROOT, 'assets/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets/data/route.json'), JSON.stringify(out));
console.log(`저장: assets/data/route.json — ${out.distance}m, ${Math.round(out.duration / 60)}분, 점 ${coords.length}개, 안내 ${steps.length}개`);
for (const s of steps) console.log(`  ${(s.at / 1000).toFixed(1)}km  ${s.text}`);
