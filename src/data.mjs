// 퀵서비스다 — 사이트에 쓰는 사실 정보는 전부 이 파일 한 곳에서 관리한다.
// 출처: 기존 홈페이지 퀵서비스다.com(2026-10-19 수집, research/legacy-html), 당근 동네업체 프로필(업체 작성),
//       타사 공개 요금표(research/market-fares-2026-10-19.md).
// 숫자를 바꾸면 홈·서비스 페이지·구조화 데이터·llms.txt·블로그 AI 팩트 시트가 같이 바뀐다.

export const ASOF = '2026-10-19';          // 요금·비교 자료 확인일
export const ASOF_LABEL = '2026년 10월';

// 환경 변수(Railway Variables 등)는 형식이 맞을 때만 기본값을 덮어쓴다(빈 값·오타로 분석이 꺼지지 않게)
const envId = (k, re, def) => (re.test(process.env[k] || '') ? process.env[k] : def);

export const SITE = {
  name: '퀵서비스다',
  nameEn: 'QUICKEY SERVICE',
  slogan: '최고보다 최선을 다하는 기업',
  // 운영 도메인. 2026-10-19 결정: 퀵서비스다.kr 메인, 기존 퀵서비스다.com은 301 예정(세느루 DB 기록).
  // 다른 주소로 운영하면 SITE_URL 환경변수 또는 이 값만 바꾸면 된다.
  url: (process.env.SITE_URL || 'https://xn--2j1bs9sn9b30bc55a.kr/').replace(/\/?$/, '/'),
  displayDomain: '퀵서비스다.kr',
  legacyDomain: '퀵서비스다.com',
  phone: '1661-7462',
  tel: '16617462',
  fax: '070-5222-2399',
  email: 'pologtrclub@naver.com',
  address: {
    street: '천호대로 391, 보니타 305호',
    district: '동대문구',
    region: '서울특별시',
    dong: '장안동',
    full: '서울특별시 동대문구 천호대로 391 보니타 305호(장안동)',
  },
  bizNo: '199-32-01090',
  freightLicense: '화물자동차운송주선사업 허가 제90143호',
  mailOrder: '통신판매업 신고 제A17-211007-0264호',
  hours: '24시간 · 365일 접수',
  area: '서울·인천·경기 전 지역, 지방은 KTX·고속버스·항공 연계와 화물차로 전국(일부 도서 지역 제외)',
  kakaoChat: 'https://pf.kakao.com/_xkHCqb/chat',
  kakaoHome: 'https://pf.kakao.com/_xkHCqb',
  order: 'https://1661-7462.com/main/order_register_m.html?price=on',
  daangn: 'https://www.daangn.com/kr/local-profile/1661-7462-5iys719cqyib/',
  bank: { name: 'IBK기업은행', no: '001-833-8688', holder: '장지훈(퀵서비스다)' },
  naverVerification: '9390a8a1b6a7ce67cd10eab279c8efd4bb828425', // 기존 .com 기준 값. .kr 연결 후 서치어드바이저에서 새 값 발급
  googleVerification: '', // Search Console URL 접두어 속성 → HTML 태그의 content 값
  // 방문 분석 ID — 형식이 맞는 것만 쓰고, 운영 빌드 + 대표 주소 접속에서만 켠다(src/analytics.mjs)
  analytics: {
    ga4: envId('GA4_ID', /^G-[A-Z0-9]{4,}$/, ''),
    gtm: envId('GTM_ID', /^GTM-[A-Z0-9]{4,}$/, ''),
    naver: envId('NAVER_WA', /^[a-z0-9]{6,}$/i, ''),
    clarity: envId('CLARITY_ID', /^[a-z0-9]{6,}$/i, ''),
  },
  indexNowKey: 'a36baa55f569e6ec024f7902edafcfcf', // IndexNow(네이버·빙 즉시 수집 알림) 키 — /<키>.txt 로 공개
  // 미래애드원(광고 대행) 로그·상담 스크립트 — 기존 홈페이지에 있던 것. 운영 배포에서만 넣는다.
  agencyScript: '//log1.toup.net/mirae_log_chat_common.js?adkey=rk1im',
  vat: '부가세 10% 별도',
};

const won = n => n.toLocaleString('ko-KR') + '원';

// ── 시작 요금 (부가세 별도) ─────────────────────────────
export const START_FARES = [
  { id: 'moto', label: '오토바이 퀵', from: 8000, note: '거리 요금, 중간 상자 1개·20kg 기준', href: 'services/motorcycle/' },
  { id: 'damas', label: '다마스 퀵', from: 20000, note: '350kg 미만, 라면 상자 약 20개', href: 'services/damas-labo/' },
  { id: 'truck', label: '1톤 용달', from: 40000, note: '카고·탑차, 2.5톤 이상은 상담', href: 'services/truck/' },
  { id: 'ktx', label: 'KTX 연계 당일특급', from: 25000, note: '최대 5시간 이내 문전 배송', href: 'services/intercity/' },
  { id: 'bus', label: '고속버스 연계 당일특급', from: 25000, note: '최대 7시간 이내 문전 배송', href: 'services/intercity/' },
  { id: 'air', label: '항공 연계 당일특급', from: 40000, note: '최대 4시간 이내 문전 배송, 제주 포함', href: 'services/intercity/' },
];

// ── 요금 규칙 (기존 홈페이지 서비스·QnA 페이지 원문 기준) ─────────
export const FARE_RULES = {
  basis: '요금은 출발지와 도착지 사이 거리, 그리고 차량 종류로 정해집니다. 물건의 부피와 무게, 기사가 직접 들고 옮기는 작업이 있는지, 작업 시간에 따라 추가 운임이 붙을 수 있습니다.',
  surchargeWhen: [
    { k: '평일 18시 이후', v: '야간 할증' },
    { k: '주말 16시 이후', v: '주말·야간 할증' },
    { k: '눈·비·태풍 등 기상 악화', v: '기상 할증' },
    { k: '출발지·도착지 대기 20분 이상', v: '대기 할증' },
  ],
  roundTrip: '왕복 요금은 적용 요금의 90%를 기준으로 계산합니다(백 원 단위 반올림). 오토바이·다마스·라보 기준입니다.',
  overload: '오토바이로 보내는 물건이 라면 상자(세 변 합 약 1m)보다 크면 과적 요금 5,000원이 더해집니다.',
  cancel: [
    { k: '오토바이', v: 3000 },
    { k: '다마스·라보', v: 5000 },
    { k: '1톤 이상 화물차', v: null },
  ],
  cancelRule: '취소 요금은 기사가 출발지 건물에 도착한 뒤 취소할 때만 받습니다. 도착 전 취소는 비용이 없습니다.',
  damasBase: '다마스는 오토바이 기본요금에 10,000원, 라보는 15,000원이 더해지는 구조입니다. 1톤은 용달 협정 요금을 따릅니다.',
  nextDay: '당일 상차 후 다음 날 이후에 하차해야 하면 추가 운임이 발생할 수 있습니다.',
  relaxed: '시간 여유가 있으면 최소 요금으로 배차합니다. 바로 출발해야 하는 급송은 거리 요금 정가가 적용됩니다.',
  express: '긴급·급송 전문 기사를 배차해 시간을 맞춥니다. 급송은 추가 요금이 있습니다.',
  intercitySurcharge: '연계배송은 화물 규격·거리에 따라 차등 요금이 적용되고, 왕복은 100% 할증, 영업 외 시간 운행 구간은 30~50% 할증입니다.',
  vat: SITE.vat,
};

// ── 결제 ────────────────────────────────────────────
export const PAYMENT = {
  methods: ['신용카드', '계좌이체', '현장 결제(현금·즉시 계좌이체)'],
  note: '기사에게 현장에서 결제할 때는 현금 또는 바로 계좌이체만 가능합니다. 신용카드 결제는 콜센터 전화 후 온라인으로 접수합니다.',
  invoice: '세금계산서를 발행합니다. 거래가 잦은 기업은 월 단위 정산이 가능합니다.',
};

// ── 오토바이 퀵 소요 시간 ───────────────────────────────
export const MOTO_TIME = [
  { k: '물건 받으러 도착', v: '5~20분' },
  { k: '근거리 배송 완료', v: '30~50분' },
  { k: '단거리', v: '1시간~1시간 30분' },
  { k: '장거리', v: '2시간~2시간 30분' },
];

// ── 오토바이 적재 규격 ─────────────────────────────────
export const MOTO_SIZE = [
  { k: '소', v: '가로+세로+높이 합 90cm 이내', w: 25 },
  { k: '중', v: '가로+세로+높이 합 150cm 이내', w: 25 },
  { k: '대', v: '지름 30cm, 길이 150cm 이내(원통형)', w: 25 },
];

// ── 차량 (소형 3종 + 화물차 제원표) ───────────────────────
export const SMALL_VEHICLES = [
  { id: 'moto', photo: 'rider.webp', name: '오토바이', max: '25kg', size: '세 변 합 150cm 이내', use: '서류, 도장, 소형 부품, 샘플, 꽃다발, 케이크', note: '가장 빠르고 요금이 낮습니다.' },
  { id: 'damas', photo: 'opt-damas.webp', name: '다마스', max: '350kg 미만', size: '라면 상자 약 20개', use: '운동기구, 화분, 꽃 배달, 가전제품, 택배사가 거절한 물품, 장거리 고가 장비', note: '지붕이 있는 밴이라 비·눈에도 물건이 젖지 않습니다.' },
  { id: 'labo', photo: 'opt-labo.webp', name: '라보', max: '450kg 미만', size: '다마스보다 큰 물건', use: '건축 자재, 공업용 기계, 장롱·진열장, 많은 짐, 나무·화환, 신문 지국 배송물', note: '적재함이 열린 소형 트럭이라 긴 물건을 싣기 좋습니다.' },
];

// 화물차 제원(cm). len은 [최소, 최대]. 출처: 기존 홈페이지 차량제원
export const TRUCKS = [
  { id: 't1', photos: ['truck-01.webp', 'truck-02.webp'], ton: '1톤', w: 160, len: [270, 285], deck: 80, cbm: '6', top: [160, 180], cap: 1000 },
  { id: 't14', photos: ['truck-03.webp', 'truck-04.webp'], ton: '1.4톤', w: 165, len: [290, 310], deck: 70, cbm: '8', top: [160, 200], cap: 1400, topCbm: '7~8', topDeck: '80~85' },
  { id: 't25', photos: ['truck-05.webp', 'truck-06.webp'], ton: '2.5톤', w: 180, len: [430, 430], deck: 100, cbm: '14', top: [180, 200], cap: 2500 },
  { id: 't35', photos: ['truck-07.webp', 'truck-08.webp'], ton: '3.5톤', w: 205, len: [406, 406], deck: 105, cbm: '18', top: [180, 200], cap: 3500, topW: '205~230', topLen: 460 },
  { id: 't5', photos: ['truck-09.webp', 'truck-10.webp'], ton: '5톤', w: 230, len: [620, 620], deck: '110~120', cbm: '26', top: [180, 230], cap: 5000 },
  { id: 't5p', photos: ['truck-11.webp', 'truck-12.webp'], ton: '5톤 플러스(축차)', w: 230, len: [730, 800], deck: '110~120', cbm: '33', top: [180, 230], cap: 5000, topDeck: '130~140' },
  { id: 't11', photos: ['truck-13.webp', null], ton: '11톤', w: 235, len: [900, 900], deck: '130~140', cbm: '50', top: [200, 250], cap: 11000, topLen: '900~1,000' },
  { id: 't25t', photos: ['truck-14.webp', null], ton: '25톤', w: 235, len: [1010, 1010], deck: 140, cbm: null, top: [250, 250], cap: 25000 },
];
export const TRUCK_LIMITS = [
  '적재 높이는 최대 4.3m, 적재 폭은 최대 2.4m까지입니다.',
  '장재물 허가를 받은 차량은 높이 4.4m, 폭 3m까지 실을 수 있습니다.',
  '츄레라는 폭 3.6m, 길이 16m, 중량 27톤까지(장재물 허가증 소지 차량에 한함) 운송합니다.',
];

// 적재함 형태 옵션
export const BODY_TYPES = [
  { id: 'cargo', photo: 'opt-cargo.webp', name: '카고', desc: '적재함이 열린 형태. 화물 종류를 가리지 않아 가장 많이 씁니다.' },
  { id: 'long', photo: 'opt-long.webp', name: '장축', desc: '일반 적재함보다 길이가 긴 적재함이 필요할 때 씁니다.' },
  { id: 'wing', photo: 'opt-wing.webp', name: '윙바디', desc: '적재함 옆면이 날개처럼 열려 지게차로 파레트를 싣고 내립니다.' },
  { id: 'lift', photo: 'opt-lift.webp', name: '리프트', desc: '적재함 뒤 파워게이트가 100~500kg을 들어 올려 상하차가 편합니다.' },
  { id: 'top', photo: 'opt-top.webp', name: '탑차', desc: '지붕과 뒷문이 있는 화물칸. 비나 눈이 오는 날 많이 씁니다.' },
  { id: 'cold', photo: 'opt-cold.webp', name: '냉동탑차', desc: '냉동기를 갖춰 냉동·냉장 식품, 수산물을 운송합니다.' },
];

// ── 화물 운송 종류 ───────────────────────────────────
export const CARGO_TYPES = [
  { k: '일반 화물', v: '1톤부터 25톤까지 전 차종. 츄레라·노브이(저상) 같은 특수 차종도 운송합니다.' },
  { k: '지방 화물', v: '경상권·전라권처럼 먼 지역은 운송비를 줄이려고 현지 차량을 수배해 운송합니다.' },
  { k: '지방 혼적 화물', v: '같은 방향의 다른 화물과 함께 실어 보내는 방식으로 경비를 줄입니다.' },
  { k: '제주도 운송', v: '배로 제주에 들어가는 차량을 수배해 화물을 직접 운송합니다.' },
  { k: '특수 화물', v: '적재함 제원을 넘어 도로교통법상 허가를 받은 차량만 실을 수 있는 화물도 운송합니다.' },
];

// ── 연계배송 ─────────────────────────────────────────
export const INTERCITY = [
  {
    id: 'ktx', photo: 'ktx.webp', name: 'KTX 연계 당일특급', short: 'KTX', from: 25000, hours: 5,
    routes: '서울·경기 ↔ 대전, 대구, 부산, 익산(전주), 광주, 목포 등 전국',
    cities: ['daejeon', 'daegu', 'busan', 'iksan', 'gwangju', 'mokpo'],
    check: '출발지·도착지 행정동 이름, 무게(10kg 이상일 때), 가로·세로·높이(cm)',
    desc: '수도권과 지방을 잇는 당일 특급 중 가장 경제적인 방법입니다. 기사가 문 앞에서 받아 KTX로 보내고, 도착역에서 협약 업체가 받아 받는 분 주소까지 전합니다.',
  },
  {
    id: 'bus', photo: 'bus.webp', name: '고속버스 연계 당일특급', short: '고속버스', from: 25000, hours: 7,
    routes: '서울·경기 ↔ 5대 광역시와 주요 도시',
    cities: ['daejeon', 'daegu', 'busan', 'gwangju', 'ulsan'],
    check: '출발지·도착지 행정동 이름, 무게(10kg 이상일 때), 가로·세로·높이(cm)',
    desc: 'KTX가 서지 않는 도시까지 터미널을 거쳐 당일에 보냅니다.',
  },
  {
    id: 'air', photo: 'air.webp', name: '항공 연계 당일특급', short: '항공', from: 40000, hours: 4,
    routes: '서울·경기 ↔ 제주, 부산, 울산, 여수(순천), 포항',
    cities: ['jeju', 'busan', 'ulsan', 'yeosu', 'pohang'],
    check: '출발지·도착지 행정동 이름, 무게(20kg 이상일 때), 가로·세로·높이(cm)',
    desc: '제주처럼 육로가 없거나 시간이 가장 급할 때 씁니다.',
  },
];
export const INTERCITY_NOTE = '연계배송은 전화로만 접수합니다(☎ 1661-7462). 결제는 현금 선불·착불, 온라인 송금, 신용카드(콜센터 전화 후 온라인 접수)로 할 수 있습니다.';

// 지도 좌표(경도, 위도)
export const CITIES = {
  seoul: { name: '서울', lon: 126.98, lat: 37.57 },
  daejeon: { name: '대전', lon: 127.38, lat: 36.35 },
  daegu: { name: '대구', lon: 128.6, lat: 35.87 },
  busan: { name: '부산', lon: 129.07, lat: 35.18 },
  iksan: { name: '익산(전주)', lon: 126.96, lat: 35.95 },
  jeonju: { name: '전주', lon: 127.15, lat: 35.82 },
  gwangju: { name: '광주', lon: 126.85, lat: 35.16 },
  mokpo: { name: '목포', lon: 126.39, lat: 34.81 },
  ulsan: { name: '울산', lon: 129.31, lat: 35.54 },
  pohang: { name: '포항', lon: 129.36, lat: 36.02 },
  yeosu: { name: '여수(순천)', lon: 127.66, lat: 34.76 },
  gangneung: { name: '강릉', lon: 128.9, lat: 37.75 },
  jeju: { name: '제주', lon: 126.53, lat: 33.5 },
};

// ── 기업 월 정산 ─────────────────────────────────────
export const BUSINESS = {
  who: ['법인 기업', '일반 사업자', '다국적·외국계 기업', '월 50만 원 이상 이용하는 기업'],
  services: ['서울·수도권(경기) 오토바이·다마스·1톤 당일 배송', '전국 지방 당일 배송(제주 포함)'],
  benefits: [
    '원하는 날짜에 한 달 이용액을 모아 한 번에 정산합니다.',
    '물류비 지출을 투명하게 관리하고 부가세 환급을 받을 수 있도록 세금계산서를 발행합니다.',
  ],
  contract: '신용 거래를 원하는 업체에 직접 방문해 계약합니다. 대표전화 1661-7462로 신청하세요.',
};

// ── 접수 → 도착 5단계 (홈 스크롤 시퀀스) ────────────────
export const PROCESS = [
  { id: 'order', no: '01', title: '접수', status: '접수 완료',
    head: '전화·카카오톡·온라인, 편한 곳으로 접수합니다',
    body: '출발 동과 도착 동, 물건 크기와 무게를 알려 주세요. 10kg이 넘는 물건은 무게를, 큰 짐은 가로·세로·높이를 함께 말씀해 주시면 요금이 처음부터 정확하게 나옵니다.' },
  { id: 'match', no: '02', title: '차량 결정', status: '차량 확정',
    head: '물건에 맞는 차를 고릅니다',
    body: '오토바이에 실리는지가 첫 기준입니다. 세 변 합 150cm·25kg을 넘으면 다마스(350kg 미만), 그보다 크거나 무거우면 라보(450kg 미만), 1톤부터 25톤까지 화물차로 넘어갑니다.' },
  { id: 'dispatch', no: '03', title: '배차', status: '배차 완료',
    head: '가까운 차량을 GPS로 찾아 배차합니다',
    body: '전국 통합 물류망과 GPS 관제 시스템으로 출발지에서 가장 가까운 차량을 찾습니다. 오토바이는 보통 5~20분 안에 물건을 받으러 갑니다.' },
  { id: 'move', no: '04', title: '운송', status: '이동 중',
    head: '시내는 1시간 안팎, 지방은 당일 도착',
    body: '오토바이 기준 근거리 30~50분, 단거리 1시간~1시간 30분, 장거리 2시간~2시간 30분이 걸립니다. 지방은 KTX·고속버스·항공을 연계해 그날 안에 문 앞까지 갑니다.' },
  { id: 'done', no: '05', title: '도착·정산', status: '배송 완료',
    head: '받는 분께 전하면 끝, 결제는 편한 방법으로',
    body: '신용카드·계좌이체·현장 결제 중에서 고르시면 됩니다. 거래가 잦은 기업은 한 달 이용액을 원하는 날짜에 모아 정산하고 세금계산서를 받습니다.' },
];

// ── 고객 후기: 당근 동네업체 페이지에 공개된 원문(맞춤법 그대로) ─────────
export const REVIEWS = {
  source: '당근 동네업체 후기',
  sourceUrl: SITE.daangn,
  checked: ASOF,
  items: [
    { id: 'r1', who: '짱구** 님', text: '사장님이  너무 친절하시고 다른 사무실보다 저렴하게 해주시고 빠른 배송 감사했습니다', tags: ['친절해요', '가격이 싸요', '만족스러워요'] },
    { id: 'r2', who: '당근 이용자', text: '상담도 기사님도 친절하시구요\n만족합니다.\n또 이용하겠습니다.', tags: ['친절해요', '가격이 싸요', '만족스러워요'] },
  ],
  tags: [ { k: '친절해요', n: 2 }, { k: '가격이 싸요', n: 2 }, { k: '만족스러워요', n: 2 } ],
};

// ── 타사 공개 요금 비교 (업체명 비공개, research/market-fares-2026-10-19.md) ──
export const MARKET = {
  date: ASOF,
  note: `각 업체 홈페이지에 공개된 시작(최저) 요금을 ${ASOF.replace(/-/g, '.')}에 확인했습니다. 실제 요금은 거리·물품·시간대에 따라 달라지며, 업체명은 표기하지 않았습니다.`,
  sets: [
    { id: 'ktx', label: 'KTX 연계', unit: '시작 요금', ours: 25000,
      others: [ { k: 'A사', v: 30000 }, { k: 'B사', v: 40000 }, { k: 'C사', v: 40000, f: '탁송료 별도' }, { k: 'D사', v: 50000 } ] },
    { id: 'bus', label: '고속버스 연계', unit: '시작 요금', ours: 25000,
      others: [ { k: 'A사', v: 30000 }, { k: 'C사', v: 35000, f: '탁송료 별도' }, { k: 'B사', v: 40000 }, { k: 'D사', v: 50000 } ] },
    { id: 'air', label: '항공 연계', unit: '시작 요금', ours: 40000,
      others: [ { k: 'A사', v: 45000 }, { k: 'B사', v: 50000 }, { k: 'D사', v: 50000 }, { k: 'C사', v: 60000, f: '탁송료 별도' } ] },
    { id: 'damas', label: '다마스', unit: '시작 요금(수도권)', ours: 20000,
      others: [ { k: 'E사', v: 25000 }, { k: 'F사', v: 25000, f: '서울 도착 최저 구간' } ] },
    { id: 'truck', label: '1톤 용달', unit: '시작 요금(수도권)', ours: 40000,
      others: [ { k: 'E사', v: 50000 } ] },
  ],
  roundTrip: [
    { k: '퀵서비스다(오토바이·다마스·라보)', v: '적용 요금의 90%' },
    { k: 'C사·D사(연계배송)', v: '편도 요금의 2배' },
    { k: 'B사(연계배송)', v: '100% 할증' },
  ],
};
export const avg = a => Math.round(a.reduce((s, x) => s + x, 0) / a.length);

// 비교할 때 확인할 것 — 퀵서비스다가 공개하고 있는 기준
export const CHECKLIST = [
  { k: '할증 기준을 미리 알려 주나', v: '평일 18시·주말 16시 이후, 기상 악화, 대기 20분 이상 — 네 가지로 공개' },
  { k: '취소 요금은 언제 받나', v: '기사가 출발지에 도착한 뒤 취소할 때만(오토바이 3,000원, 다마스·라보 5,000원)' },
  { k: '왕복은 얼마인가', v: '적용 요금의 90% 기준' },
  { k: '지방은 어떤 방법이 있나', v: 'KTX·고속버스·항공 연계, 현지 차량 수배, 혼적까지 다섯 가지' },
  { k: '차량은 어디까지 되나', v: '오토바이부터 25톤, 냉동탑차·리프트·윙바디·츄레라까지' },
  { k: '사업자 거래가 되나', v: '세금계산서 발행, 월 50만 원 이상이면 월 정산' },
  { k: '허가를 받은 업체인가', v: SITE.freightLicense },
];

// 요금 줄이는 방법
export const SAVE_TIPS = [
  { t: '시간 여유가 있으면 미리 말씀하세요', d: '급하지 않은 물건은 최소 요금으로 배차합니다. 바로 출발하는 급송은 거리 요금 정가가 적용됩니다.' },
  { t: '같은 방향 두 곳은 경유로', d: '기사 한 명이 출발지 → 도착지 A → 도착지 B 순서로 갑니다. 시간이 조금 더 걸리는 대신 요금이 줄어듭니다.' },
  { t: '지방은 화물차보다 연계배송', d: '작은 짐을 부산·광주로 보낼 때는 차를 통째로 보내지 않고 KTX·고속버스에 실어 보내는 편이 저렴합니다.' },
  { t: '지방 화물은 혼적·현지 차량', d: '다른 화물과 함께 싣거나 도착 지역 차량을 수배해 빈 차로 돌아오는 비용을 줄입니다.' },
];

// ── FAQ ──────────────────────────────────────────────
// cat: fare | order | vehicle | intercity | pay,  pages: 이 질문을 보여 줄 페이지 id
export const FAQ = [
  { id: 'fare-how', cat: 'fare', pages: ['home', 'pricing', 'motorcycle'],
    q: '퀵서비스 요금은 어떻게 계산되나요?',
    a: '거리와 차량 종류로 기본 요금이 정해집니다. 여기에 물건의 부피·무게, 기사가 직접 옮기는 작업이 있는지, 대기 시간 등에 따라 추가 운임이 붙을 수 있습니다. 접수할 때 출발 동, 도착 동, 물건 크기를 알려 주시면 확정 금액을 먼저 안내해 드립니다. 오토바이는 8,000원부터, 다마스는 20,000원부터, 1톤은 40,000원부터이며 부가세 10%는 별도입니다.' },
  { id: 'surcharge', cat: 'fare', pages: ['home', 'pricing'],
    q: '할증은 언제 붙나요?',
    a: '평일 18시 이후, 주말 16시 이후, 눈·비·태풍 같은 기상 악화 때, 그리고 출발지나 도착지에서 기사가 20분 넘게 기다려야 할 때 할증이 적용될 수 있습니다. 정확한 금액은 1661-7462로 문의해 주세요.' },
  { id: 'multi', cat: 'order', pages: ['home', 'pricing', 'motorcycle', 'business'],
    q: '두 곳 이상으로 보내야 하면 어떻게 하나요?',
    a: '두 가지 방법이 있습니다. 시간 여유가 있으면 기사 한 명이 출발지 → 도착지 A → 도착지 B 순서로 도는 경유 방식이 요금이 적게 듭니다(출발지→A 요금 + A→B 요금). 빨리 보내야 하면 도착지마다 다른 기사가 출발하는 각각 편도 방식이 빠르지만, 요금은 구간마다 따로 계산합니다.' },
  { id: 'cancel', cat: 'fare', pages: ['home', 'pricing', 'motorcycle', 'damas-labo'],
    q: '접수 후 취소하면 비용이 드나요?',
    a: '기사가 출발지에 도착하기 전에 취소하면 비용이 없습니다. 기사가 도착한 뒤 취소하면 오토바이 3,000원, 다마스·라보 이상 5,000원의 취소비가 있고, 1톤 이상 대형 차량은 전화로 안내해 드립니다.' },
  { id: 'urgent', cat: 'order', pages: ['home', 'motorcycle'],
    q: '아주 급한 물건은 얼마나 빨리 보낼 수 있나요?',
    a: '긴급·급송 전문 기사를 배차해 최대한 시간을 맞춥니다. 오토바이는 보통 5~20분 안에 물건을 받으러 가고, 근거리는 30~50분 안에 도착합니다. 급송은 추가 요금이 있으니 접수할 때 함께 안내해 드립니다.' },
  { id: 'local', cat: 'intercity', pages: ['home', 'intercity', 'truck'],
    q: '지방으로 물건을 보내려면 어떻게 하나요?',
    a: '작은 짐은 KTX나 고속버스, 항공편에 실어 해당 지역까지 보내고, 도착지의 협약 업체가 받아 받는 분 주소까지 전합니다. 비용을 줄이면서 당일에 받을 수 있습니다. 큰 화물은 현지 차량을 수배하거나 다른 화물과 함께 싣는 혼적으로 보냅니다.' },
  { id: 'pay', cat: 'pay', pages: ['home', 'pricing', 'business'],
    q: '결제는 어떻게 하나요?',
    a: '신용카드, 계좌이체, 현장 결제 중에서 고르시면 됩니다. 기사에게 현장에서 결제할 때는 현금이나 바로 계좌이체만 가능합니다. 기업이나 자주 이용하는 거래처는 월 결제가 가능합니다.' },
  { id: 'invoice', cat: 'pay', pages: ['home', 'business', 'pricing'],
    q: '세금계산서 발행이 되나요? 부가세는 별도인가요?',
    a: '세금계산서를 발행합니다. 안내하는 요금에는 부가세 10%가 포함되어 있지 않습니다. 월 50만 원 이상 이용하는 기업은 원하는 날짜에 한 달 이용액을 모아 정산할 수 있습니다.' },
  { id: 'moto-size', cat: 'vehicle', pages: ['home', 'motorcycle', 'vehicles'],
    q: '오토바이 퀵으로 보낼 수 있는 크기는 어디까지인가요?',
    a: '가로·세로·높이를 더한 값이 150cm 이내이고 무게가 25kg 이하면 오토바이로 보낼 수 있습니다. 원통형은 지름 30cm, 길이 150cm까지 됩니다. 라면 상자(세 변 합 약 1m)보다 크면 과적 요금 5,000원이 더해집니다.' },
  { id: 'damas-labo', cat: 'vehicle', pages: ['home', 'damas-labo', 'vehicles'],
    q: '다마스와 라보는 무엇이 다른가요?',
    a: '다마스는 지붕이 있는 소형 밴으로 350kg 미만, 라면 상자 약 20개 정도를 싣습니다. 비나 눈에 젖으면 안 되는 물건, 가전제품, 화분에 맞습니다. 라보는 적재함이 열린 소형 트럭으로 450kg 미만까지 싣고, 건축 자재나 장롱처럼 길거나 큰 물건에 맞습니다.' },
  { id: 'hours', cat: 'order', pages: ['home', 'motorcycle', 'damas-labo', 'truck'],
    q: '몇 시까지 접수할 수 있나요?',
    a: '24시간, 365일 접수합니다. 대표전화 1661-7462로 전화하시거나 카카오톡 채널에서 ‘퀵서비스다’를 검색해 상담하실 수 있습니다. 평일 18시 이후와 주말 16시 이후에는 할증이 적용될 수 있습니다.' },
  { id: 'jeju', cat: 'intercity', pages: ['intercity', 'truck', 'home'],
    q: '제주도로도 보낼 수 있나요?',
    a: '보낼 수 있습니다. 작은 짐은 항공 연계 당일특급으로 최대 4시간 안에 문 앞까지 전하고, 기본요금은 40,000원부터입니다. 화물은 배로 제주에 들어가는 차량을 수배해 직접 운송합니다.' },
  { id: 'next-day', cat: 'fare', pages: ['truck', 'pricing'],
    q: '오늘 싣고 내일 내려야 하는 화물도 되나요?',
    a: '가능합니다. 다만 당일 상차 후 다음 날 이후에 하차하면 추가 운임이 발생할 수 있으니 접수할 때 하차 일정을 함께 알려 주세요.' },
  { id: 'round', cat: 'fare', pages: ['pricing', 'motorcycle', 'damas-labo'],
    q: '왕복으로 다녀와야 하면 요금이 두 배인가요?',
    a: '두 배가 아닙니다. 오토바이·다마스·라보 왕복은 적용 요금의 90%를 기준으로 계산하고 백 원 단위에서 반올림합니다. KTX·고속버스·항공 연계배송은 왕복 시 100% 할증이 붙습니다.' },
  { id: 'damage', cat: 'order', pages: ['pricing', 'about'],
    q: '배송 중 물건이 파손되면 어떻게 되나요?',
    a: '배송장에 물건 가액을 적으면 그 가액이 손해배상 기준이 됩니다. 가액을 적지 않으면 이용약관에 따라 손해배상 한도 50만 원이 적용됩니다. 50만 원이 넘는 물건이나 특별히 조심해야 하는 물건은 접수할 때 미리 알려 주세요.' },
  { id: 'truck-pick', cat: 'vehicle', pages: ['truck', 'vehicles'],
    q: '몇 톤 트럭을 불러야 할지 모르겠어요.',
    a: '가장 긴 물건의 길이와 전체 무게가 기준입니다. 1톤 적재함은 길이 270~285cm, 2.5톤은 430cm, 5톤은 620cm, 11톤은 900cm입니다. 파레트를 지게차로 싣는다면 윙바디, 상하차 인력이 없으면 리프트, 냉동·냉장은 냉동탑차가 맞습니다. 차량 제원 페이지의 추천 도구를 쓰거나 전화로 물건을 설명해 주세요.' },
  { id: 'ktx-what', cat: 'intercity', pages: ['intercity'],
    q: 'KTX 연계배송은 어떻게 진행되나요?',
    a: '기사가 출발지에서 물건을 받아 KTX에 싣고, 도착역에서 협약 업체가 받아 받는 분 주소까지 전합니다. 서울·경기에서 대전·대구·부산·익산(전주)·광주·목포 등으로 최대 5시간 이내에 보내며 기본요금은 25,000원부터입니다. 전화로만 접수합니다.' },
  { id: 'business-how', cat: 'pay', pages: ['business'],
    q: '월 정산 거래는 어떻게 시작하나요?',
    a: '대표전화 1661-7462로 신청하시면 담당자가 업체를 방문해 신용 거래 계약을 맺습니다. 대상은 법인, 일반 사업자, 다국적·외국계 기업 중 월 50만 원 이상 이용하는 곳입니다.' },
];
export const FAQ_CATS = [
  { id: 'all', name: '전체' },
  { id: 'fare', name: '요금' },
  { id: 'order', name: '접수·배송' },
  { id: 'vehicle', name: '차량·물품' },
  { id: 'intercity', name: '지방·연계' },
  { id: 'pay', name: '결제·정산' },
];

// ── 서비스 페이지 ─────────────────────────────────────
export const SERVICES = [
  {
    id: 'motorcycle', slug: 'services/motorcycle/', icon: 'moto', photo: 'rider.webp', photoAlt: '배송 상자를 싣고 달리는 오토바이', name: '오토바이 퀵',
    title: '오토바이 퀵서비스 — 서울·경기·인천 8,000원부터, 24시간 접수',
    desc: '서류·소형 물품을 오토바이로 바로 보냅니다. 세 변 합 150cm·25kg까지, 5~20분 안에 픽업하고 근거리는 30~50분 안에 도착합니다. 8,000원부터(부가세 별도).',
    lead: '서류, 도장, 샘플, 소형 부품처럼 한 사람이 들고 갈 수 있는 물건은 오토바이가 가장 빠르고 저렴합니다. 가로·세로·높이 합 150cm, 25kg 이하라면 오토바이로 보낼 수 있습니다.',
    card: '서류·소형 물품. 세 변 합 150cm, 25kg까지.',
    from: 8000, keywords: ['오토바이퀵', '퀵서비스', '서류 퀵', '서울 퀵서비스'],
  },
  {
    id: 'damas-labo', slug: 'services/damas-labo/', icon: 'van', photo: 'damas-labo.webp', photoAlt: '다마스와 라보', name: '다마스·라보 퀵',
    title: '다마스·라보 퀵 — 350kg·450kg 미만 소형 화물, 20,000원부터',
    desc: '오토바이에 싣지 못하는 큰 짐은 다마스(350kg 미만, 라면 상자 약 20개)나 라보(450kg 미만)로 보냅니다. 다마스 20,000원부터, 24시간 접수.',
    lead: '오토바이에 실리지 않는 짐부터는 다마스와 라보입니다. 지붕 있는 밴 다마스는 350kg 미만, 적재함이 열린 라보는 450kg 미만까지 싣습니다.',
    card: '오토바이에 안 실리는 짐. 다마스 350kg·라보 450kg 미만.',
    from: 20000, keywords: ['다마스퀵', '라보퀵', '다마스 요금', '용달'],
  },
  {
    id: 'truck', slug: 'services/truck/', icon: 'truck', photo: 'small-truck.webp', photoAlt: '퀵서비스다 로고가 들어간 화물 탑차', name: '화물운송 1톤~25톤',
    title: '화물운송 1톤~25톤 — 카고·윙바디·냉동탑차, 전국 당일 배차',
    desc: '1톤 용달부터 25톤, 츄레라·특수 화물까지 전 차종을 배차합니다. 지방은 현지 차량 수배와 혼적으로 운송비를 줄입니다. 1톤 40,000원부터.',
    lead: '1톤 용달부터 25톤 트럭, 츄레라와 특수 화물까지 차종을 가리지 않고 배차합니다. 카고·탑차·윙바디·리프트·냉동탑차 중 화물에 맞는 적재함을 고릅니다.',
    card: '1톤부터 25톤, 츄레라·특수 화물까지.',
    from: 40000, keywords: ['화물운송', '용달', '1톤 용달', '윙바디', '냉동탑차'],
  },
  {
    id: 'intercity', slug: 'services/intercity/', icon: 'rail', photo: 'ktx.webp', photoAlt: 'KTX 고속열차', name: 'KTX·고속버스·항공 연계',
    title: 'KTX·고속버스·항공 연계배송 — 수도권↔지방 당일 문전 배송 25,000원부터',
    desc: '서울·경기에서 부산·대구·광주·제주까지 당일에 받습니다. KTX 최대 5시간·25,000원부터, 고속버스 최대 7시간·25,000원부터, 항공 최대 4시간·40,000원부터.',
    lead: '작은 짐을 지방으로 당일에 보내야 할 때는 화물차보다 KTX·고속버스·항공에 실어 보내는 편이 빠르고 저렴합니다. 문 앞에서 받아 문 앞까지 전합니다.',
    card: '수도권↔지방 당일 문전 배송.',
    from: 25000, keywords: ['KTX 퀵', '고속버스 퀵', '항공 퀵', '지방 당일배송', '연계배송'],
  },
];

export const NAV = [
  { href: 'services/motorcycle/', label: '서비스', children: SERVICES.map(s => ({ href: s.slug, label: s.name, sub: s.card })) },
  { href: 'pricing/', label: '요금' },
  { href: 'vehicles/', label: '차량 제원' },
  { href: 'business/', label: '기업 고객' },
  { href: 'faq/', label: '자주 묻는 질문' },
  { href: 'blog/', label: '물류 가이드' },
  { href: 'about/', label: '회사 소개' },
];

export const COMPANY_INTRO = [
  '퀵서비스다는 서울 동대문구 장안동에 사무실을 둔 퀵서비스·화물운송 주선 업체입니다. 오토바이 퀵부터 다마스·라보, 1톤에서 25톤 화물차, KTX·고속버스·항공 연계배송까지 한 번의 전화로 접수해 배차합니다.',
  '고객의 시간과 맡기신 물건, 그리고 배송 기사님의 안전과 적정 운임을 함께 생각합니다. 실시간 전국 통합 물류망과 GPS 관제 시스템으로 출발지에서 가장 알맞은 차량을 찾아 배차하고, 상담은 정직하고 친절하게 하겠다는 원칙을 지키고 있습니다.',
  '최고라고 말하기보다 최선을 다하는 회사가 되겠습니다.',
];

export const BLOG_CATEGORIES = ['요금 가이드', '보내는 방법', '차량·화물', '지방·연계배송', '기업 물류'];

// ── 블로그 썸네일 사진(기존 퀵서비스다.com 고객사 사진을 다듬은 것, tools/prepare_photos.py) ──
// 글 제목·태그·카테고리에 아래 단어가 들어 있으면 그 사진을 쓴다(위에서부터 먼저 맞는 것). fit: cover=꽉 채움, cut=흰 배경 차량 사진
// 머리말에 image: <key> 를 쓰면 그 사진으로 고정된다.
export const BLOG_IMAGES = [
  { key: 'cold', file: 'opt-cold.webp', fit: 'cut', alt: '냉동탑차', words: ['냉동', '냉장', '식자재', '수산'] },
  { key: 'lift', file: 'opt-lift.webp', fit: 'cut', alt: '리프트 화물차', words: ['리프트', '파워게이트', '상하차 인력'] },
  { key: 'wing', file: 'opt-wing.webp', fit: 'cut', alt: '옆면이 열린 윙바디 트럭', words: ['윙바디', '파레트', '지게차', '행사', '전시'] },
  { key: 'long', file: 'opt-long.webp', fit: 'cut', alt: '장축 카고 트럭', words: ['장축', '긴 자재', '자재'] },
  { key: 'bigtruck', file: 'truck-14.webp', fit: 'cut', alt: '대형 카고 트럭', words: ['11톤', '25톤', '츄레라', '특수 화물', '중량물', '대형'] },
  { key: 'air', file: 'air.webp', fit: 'cut', alt: '여객기', words: ['항공', '제주', '공항', '김포', '울산', '포항', '여수'] },
  { key: 'bus', file: 'bus.webp', fit: 'cut', alt: '고속버스', words: ['고속버스', '터미널'] },
  { key: 'ktx', file: 'ktx.webp', fit: 'cut', alt: 'KTX 고속열차', words: ['KTX', '부산', '대구', '대전', '광주', '목포', '익산', '지방', '연계'] },
  { key: 'damas', file: 'opt-damas.webp', fit: 'cut', alt: '다마스 소형 밴', words: ['다마스', '가전', '택배'] },
  { key: 'labo', file: 'opt-labo.webp', fit: 'cut', alt: '라보 소형 트럭', words: ['라보'] },
  { key: 'damas-labo', file: 'damas-labo.webp', fit: 'cut', alt: '다마스와 라보', words: ['원룸', '이사', '짐', '반품', '교환'] },
  { key: 'top', file: 'opt-top.webp', fit: 'cut', alt: '탑차', words: ['탑차', '비 오는', '눈', '기상'] },
  { key: 'truck1', file: 'truck-01.webp', fit: 'cut', alt: '1톤 카고 트럭', words: ['1톤', '용달', '톤', '화물', '적재함', '트럭', '하차', '혼적'] },
  { key: 'brand-truck', file: 'small-truck.webp', fit: 'cut', alt: '퀵서비스다 로고가 들어간 화물 탑차', words: ['기업', '정산', '세금계산서', '거래처', '총무', '법인', '부가세', '결제', '공장', '부품'] },
  { key: 'ride', file: 'ride.webp', fit: 'cover', alt: '도로를 빠르게 달리는 오토바이', words: ['급송', '급한', '빠른', '당일', '야간', '심야', '새벽', '24시간', '1시간'] },
  { key: 'fleet', file: 'truck-scooter.webp', fit: 'cut', alt: '화물 탑차와 오토바이', words: ['요금', '비용', '계산', '차종', '차량 선택', '택배와'] },
  { key: 'rider', file: 'rider.webp', fit: 'cut', alt: '배송 상자를 싣고 달리는 오토바이', words: ['오토바이', '서류', '계약서', '퀵', '경유', '요금', '할증', '취소', '왕복', '과적', '포장', '파손'] },
];
export const BLOG_IMAGE_FALLBACK = { '요금 가이드': 'rider', '보내는 방법': 'ride', '차량·화물': 'truck1', '지방·연계배송': 'ktx', '기업 물류': 'brand-truck' };

export { won };
