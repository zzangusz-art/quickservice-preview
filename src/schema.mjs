// 구조화 데이터(JSON-LD). 모든 페이지는 @graph 하나로 내보낸다.
import { SITE, START_FARES, SERVICES, ASOF } from './data.mjs';

const ORG_ID = () => SITE.url + '#org';
const SITE_ID = () => SITE.url + '#website';

export function organization() {
  return {
    '@type': 'LocalBusiness',
    '@id': ORG_ID(),
    name: SITE.name,
    alternateName: [SITE.nameEn, '퀵서비스 다', SITE.displayDomain],
    slogan: SITE.slogan,
    description: '서울·인천·경기 퀵서비스와 전국 화물운송 주선 업체. 오토바이 퀵, 다마스·라보, 1톤~25톤 화물차, KTX·고속버스·항공 연계 당일배송을 24시간 접수합니다.',
    url: SITE.url,
    logo: SITE.url + 'assets/img/brand/logo.png',
    image: SITE.url + 'assets/img/og-default.png',
    telephone: '+82-1661-7462',
    faxNumber: '+82-70-5222-2399',
    email: SITE.email,
    taxID: SITE.bizNo,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.district,
      addressRegion: SITE.address.region,
      addressCountry: 'KR',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00', closes: '23:59',
    },
    areaServed: [
      { '@type': 'City', name: '서울특별시' },
      { '@type': 'City', name: '인천광역시' },
      { '@type': 'AdministrativeArea', name: '경기도' },
      { '@type': 'Country', name: '대한민국' },
    ],
    priceRange: '₩8,000~',
    currenciesAccepted: 'KRW',
    paymentAccepted: '신용카드, 계좌이체, 현금',
    knowsAbout: ['퀵서비스', '오토바이 퀵', '다마스 퀵', '라보 퀵', '화물운송', '용달', 'KTX 연계배송', '고속버스 연계배송', '항공 연계배송'],
    hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: '허가', name: SITE.freightLicense },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: '퀵서비스·화물운송 시작 요금',
      itemListElement: START_FARES.map(f => ({
        '@type': 'Offer',
        name: f.label,
        url: SITE.url + f.href,
        priceSpecification: { '@type': 'PriceSpecification', minPrice: f.from, priceCurrency: 'KRW', valueAddedTaxIncluded: false },
        itemOffered: { '@type': 'Service', name: f.label, description: f.note },
      })),
    },
    contactPoint: [{ '@type': 'ContactPoint', telephone: '+82-1661-7462', contactType: 'customer service', availableLanguage: 'Korean', hoursAvailable: 'Mo-Su 00:00-23:59' }],
    sameAs: [SITE.kakaoHome, SITE.daangn],
  };
}

export function website() {
  return { '@type': 'WebSite', '@id': SITE_ID(), url: SITE.url, name: SITE.name, inLanguage: 'ko-KR', publisher: { '@id': ORG_ID() } };
}

export function webpage({ url, title, description, type = 'WebPage', modified = ASOF }) {
  return { '@type': type, '@id': url + '#webpage', url, name: title, description, inLanguage: 'ko-KR', isPartOf: { '@id': SITE_ID() }, about: { '@id': ORG_ID() }, dateModified: modified };
}

export function breadcrumb(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })) };
}

export function faqPage(faqs, url) {
  return {
    '@type': 'FAQPage', '@id': url + '#faq',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function service(s) {
  return {
    '@type': 'Service', '@id': SITE.url + s.slug + '#service',
    name: s.name, serviceType: s.name, description: s.desc, url: SITE.url + s.slug,
    provider: { '@id': ORG_ID() },
    areaServed: s.id === 'intercity' ? { '@type': 'Country', name: '대한민국' } : [{ '@type': 'City', name: '서울특별시' }, { '@type': 'City', name: '인천광역시' }, { '@type': 'AdministrativeArea', name: '경기도' }],
    hoursAvailable: 'Mo-Su 00:00-23:59',
    offers: { '@type': 'Offer', priceSpecification: { '@type': 'PriceSpecification', minPrice: s.from, priceCurrency: 'KRW', valueAddedTaxIncluded: false } },
  };
}

export function blogPosting(p, url) {
  return {
    '@type': 'BlogPosting', '@id': url + '#article', headline: p.title, description: p.description,
    datePublished: p.date, dateModified: p.updated || p.date, inLanguage: 'ko-KR', url,
    mainEntityOfPage: url, articleSection: p.category, keywords: p.tags.join(', '),
    author: { '@type': 'Organization', name: p.author || '퀵서비스다 운영팀', url: SITE.url + 'about/' },
    publisher: { '@id': ORG_ID() },
    image: SITE.url + 'assets/img/og-blog.png',
  };
}

export const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes.flat().filter(Boolean) });
export { SERVICES };
