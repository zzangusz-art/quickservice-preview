"""기존 퀵서비스다.com 이미지(고객사 자산)를 새 사이트용으로 자르고 보정해 WebP로 만든다.
사용: python tools/prepare_photos.py <기존 이미지 폴더(research/legacy-html)>
- 원본: <폴더>/site/img/..., <폴더>/img/...  (2026-10-19 기존 홈페이지에서 받은 파일)
- 결과: assets/img/brand/*, assets/img/photo/*  (다시 돌려도 같은 결과)
"""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, 'assets/img/brand')
PHOTO = os.path.join(ROOT, 'assets/img/photo')
os.makedirs(BRAND, exist_ok=True); os.makedirs(PHOTO, exist_ok=True)
src = lambda p: os.path.join(SRC, p)


def save(im, path, q=84, lossless=False):
    im.save(path, 'WEBP', quality=q, method=6, lossless=lossless)
    print('만듦', os.path.relpath(path, ROOT), im.size, os.path.getsize(path) // 1024, 'KB')


def on_white(im):
    im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im); return bg.convert('RGB')


def trim(im, pad=6):
    """투명·흰 여백을 잘라낸다"""
    rgb = on_white(im)
    diff = ImageChops.difference(rgb, Image.new('RGB', rgb.size, (255, 255, 255)))
    bbox = diff.convert('L').point(lambda v: 255 if v > 18 else 0).getbbox()
    if not bbox: return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def up(im, scale=2):
    im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))


# ── 로고 ──
logo = trim(Image.open(src('img/main/banner_logo.png')) if os.path.exists(src('img/main/banner_logo.png')) else Image.open(src('img/banner_logo.png')), 2)
logo.save(os.path.join(BRAND, 'logo.png'), optimize=True); save(logo, os.path.join(BRAND, 'logo.webp'), lossless=True)
white = trim(Image.open(src('site/img/main3/mobile_logo.png')), 2)
white.save(os.path.join(BRAND, 'logo-white.png'), optimize=True); save(white, os.path.join(BRAND, 'logo-white.webp'), lossless=True)
fav = Image.open(src('img/favicon.png')).convert('RGBA')
fav.resize((180, 180), Image.LANCZOS).save(os.path.join(BRAND, 'apple-touch-icon.png'), optimize=True)
fav.save(os.path.join(ROOT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
print('만듦 favicon.ico, apple-touch-icon.png')

# ── 히어로: 달리는 오토바이(기존 메인 슬라이드) → 맑은 하늘 톤으로 보정 ──
ride = Image.open(src('site/img/main/main_slide_01.jpg')).convert('RGB')
r, g, b = ride.split()
r = r.point(lambda v: v * 0.84); g = g.point(lambda v: min(255, v * 0.97)); b = b.point(lambda v: min(255, v * 1.12 + 6))
ride = Image.merge('RGB', (r, g, b))
ride = ImageEnhance.Brightness(ride).enhance(1.06)
ride = ImageEnhance.Color(ride).enhance(0.92)
# 위쪽 하늘에 스카이블루를 얹는다(위 55%까지 점점 옅게)
sky = Image.new('RGB', ride.size, (96, 188, 240))
mask = Image.new('L', ride.size)
for y in range(ride.height):
    a = max(0, 1 - y / (ride.height * 0.55)) * 0.55
    mask.paste(int(a * 255), (0, y, ride.width, y + 1))
ride = Image.composite(sky, ride, mask)
save(ride.crop((280, 0, 1920, 1080)).resize((1440, 949), Image.LANCZOS), os.path.join(PHOTO, 'hero-ride.webp'), q=80)
save(ride.crop((760, 40, 1700, 980)).resize((900, 900), Image.LANCZOS), os.path.join(PHOTO, 'hero-ride-m.webp'), q=80)
save(ride.crop((380, 120, 1920, 930)).resize((960, 505), Image.LANCZOS), os.path.join(PHOTO, 'ride.webp'), q=80)

# ── 배송 사진(기존 메인 서비스 이미지에서 로고·전화번호 부분을 뺀 아랫부분) ──
def crop_box(path, box, name, scale=2):
    im = on_white(Image.open(src(path))).crop(box)
    save(up(im, scale), os.path.join(PHOTO, name))

crop_box('site/img/main3/main_freight_service_img_01.png', (0, 168, 310, 388), 'rider.webp')
crop_box('site/img/main3/main_freight_service_img_02.png', (0, 168, 310, 388), 'damas-labo.webp')
crop_box('site/img/main3/main_freight_service_img_03.png', (0, 168, 310, 388), 'small-truck.webp')
crop_box('site/img/main/main_bg_06.jpg', (222, 92, 476, 330), 'ktx.webp')
crop_box('site/img/main/main_bg_07.jpg', (172, 96, 476, 343), 'bus.webp')
crop_box('site/img/main/main_bg_08.jpg', (176, 92, 476, 300), 'air.webp')
crop_box('site/img/main3/mobile_company_logo.png', (0, 478, 1057, 840), 'truck-scooter.webp', 1)

# ── 차량 옵션(다마스·라보·카고·장축·윙바디·리프트·탑차·냉동탑차) ──
# 기존 사진 적재함·차체에 찍힌 다른 업체 표기(전국네트워크물류)를 지운다:
# 상자(box) 안을 같은 열의 위(ytop)·아래(ybot) 색으로 세로 보간해 채운다. 좌표는 trim 뒤 기준.
def erase(im, box, p0, p1, mode='v'):
    """mode 'v': 같은 열의 위(p0)·아래(p1) 색으로 세로 보간, 'h': 같은 행의 왼쪽(p0)·오른쪽(p1) 색으로 가로 보간(가로 줄무늬 위)"""
    px = im.load(); x0, y0, x1, y1 = box
    for x in range(x0, x1):
        for y in range(y0, y1):
            if mode == 'v': a, b, t = px[x, p0], px[x, p1], (y - p0) / (p1 - p0)
            else: a, b, t = px[p0, y], px[p1, y], (x - p0) / (p1 - p0)
            px[x, y] = tuple(int(a[c] * (1 - t) + b[c] * t) for c in range(3))
    reg = im.crop((x0 - 2, y0 - 2, x1 + 2, y1 + 2)).filter(ImageFilter.GaussianBlur(1.2))
    im.paste(reg, (x0 - 2, y0 - 2))
    return im

ERASE = {
    'cargo': [((396, 120, 474, 140), 118, 142)],
    'long': [((410, 103, 479, 121), 407, 481, 'h')],
    'wing': [((303, 198, 398, 223), 196, 225)],
    'lift': [((205, 113, 296, 138), 111, 140)],
    'top': [((325, 42, 458, 182), 38, 186)],
    'cold': [((36, 50, 138, 152), 46, 156)],
    'damas': [((60, 116, 172, 152), 114, 154)],
}
for i, name in enumerate(['cargo', 'long', 'wing', 'lift', 'top', 'cold', 'damas', 'labo'], 1):
    im = trim(on_white(Image.open(src(f'site/img/main3/option0{i}_big.png'))), 10)
    for spec in ERASE.get(name, []):
        im = erase(im, *spec)
    save(im, os.path.join(PHOTO, f'opt-{name}.webp'))

# ── 톤수별 화물차 실사(기존 차량제원 페이지 순서) ──
for i in range(1, 16):
    im = on_white(Image.open(src(f'site/img/truck_info/car_size{i:02d}.png')))
    save(up(trim(im, 8)), os.path.join(PHOTO, f'truck-{i:02d}.webp'))
