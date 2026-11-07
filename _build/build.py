"""Сборка сайта Юлии Бердниковой из данных site.json.

Запуск из папки сайта:  python _build/build.py
Скрипт перезаписывает HTML-страницы. Правьте тексты здесь, а данные — в site.json.
Принцип ТЗ: неподтверждённые сведения не выводятся вообще (никаких видимых заглушек).
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((Path(__file__).parent / 'site.json').read_text(encoding='utf-8'))
E = html.escape

# ---------- Каналы связи ----------
def digits(s): return re.sub(r'\D', '', str(s or ''))
def norm_phone(p):
    d = digits(p)
    if len(d) == 11 and d[0] == '8': d = '7' + d[1:]
    return d
def fmt_phone(p):
    d = norm_phone(p)
    return f'+7 {d[1:4]} {d[4:7]}-{d[7:9]}-{d[9:]}' if len(d) == 11 else str(p)
def ch_href(k):
    v = D.get(k)
    if not v: return None
    v = str(v).strip()
    if k == 'phone': return 'tel:+' + norm_phone(v)
    if k == 'telegram': return v if v.startswith('http') else 'https://t.me/' + v.lstrip('@')
    if k == 'whatsapp':
        base = v if v.startswith('http') else 'https://wa.me/' + norm_phone(v)
        from urllib.parse import quote
        return base + ('&' if '?' in base else '?') + 'text=' + quote(D.get('messageText') or '')
    if k == 'max': return v if v.startswith('http') else None
LABEL = {'telegram': 'Написать в Telegram', 'whatsapp': 'Написать в WhatsApp', 'max': 'Написать в Max', 'phone': 'Позвонить'}
ORDER = ['telegram', 'whatsapp', 'max', 'phone']
CH = [k for k in ORDER if ch_href(k)]
if D.get('primary') in CH: CH.remove(D['primary']); CH.insert(0, D['primary'])
HAS_CONTACT = bool(CH)
NEWTAB = '<span class="sr-only"> (откроется в новой вкладке)</span>'

def contact_link(k, cls):
    ext = k != 'phone'
    txt = f'Позвонить: {fmt_phone(D["phone"])}' if k == 'phone' else LABEL[k]
    t = ' target="_blank" rel="noopener"' if ext else ''
    return f'<a class="btn {cls}" href="{E(ch_href(k))}"{t} data-goal="contact_{k}">{txt}{NEWTAB if ext else ""}</a>'
def contacts_block():
    return '<div class="btns">' + ''.join(contact_link(k, 'btn--gold' if i == 0 else 'btn--dark') for i, k in enumerate(CH)) + '</div>'

HOURS = f'{D["days"]}, {D["hours"]}' if D.get('days') and D.get('hours') else 'По предварительной записи'

# ---------- Изображения ----------
def pic(R, key, w, h, alt, sizes, lazy=True, cls=''):
    ss = lambda ext: ', '.join(f'{R}img/{key}-{x}.{ext} {x}w' for x in (480, 960, 1600))
    l = ' loading="lazy"' if lazy else ' fetchpriority="high"'
    c = f' class="{cls}"' if cls else ''
    return (f'<picture><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}"><source type="image/webp" srcset="{ss("webp")}" sizes="{sizes}">'
            f'<img{c} src="{R}img/{key}-960.jpg" srcset="{ss("jpg")}" sizes="{sizes}" width="960" height="{round(960 * h / w)}" alt="{E(alt)}"{l}></picture>')
GALLERY = [('room-sofa-corner', 'g-xl', 6016, 4003, 'Диван в углу кабинета, графитовые шторы и кирпичные стены', 'Диван'),
           ('room-armchairs', '', 6048, 4024, 'Два кресла для встреч у светлой кирпичной стены', 'Кресла для встреч'),
           ('detail-open-book', 'g-tall', 4024, 6048, 'Раскрытая книга на светлом столе', 'Книги'),
           ('detail-pillows', '', 6048, 4024, 'Подушки на диване', 'Подушки'),
           ('room-table', 'g-wide', 6003, 3994, 'Стол и стулья у кирпичной стены', 'Стол'),
           ('detail-fabric', '', 6048, 4024, 'Обивка дивана крупным планом', 'Детали'),
           ('yulia-at-desk', 'g-xl', 6048, 4024, 'Юлия Бердникова сидит у стола в кабинете', 'Юлия в кабинете'),
           ('room-desk', '', 6048, 4024, 'Рабочий стол с книгами и записями', 'Рабочий стол'),
           ('detail-pillow', '', 6048, 4024, 'Бархатная подушка с полосами крупным планом', 'Текстиль'),
           ('room-desk-side', '', 6048, 4024, 'Стол с ящиками и стул', 'Рабочее место'),
           ('detail-books', '', 4773, 3176, 'Стопка книг и тетрадей на столе', 'Записи'),
           ('detail-book', '', 6048, 4024, 'Руки с раскрытой книгой у окна', 'Свет из окна')]
def gallery(R, n=None):
    items = GALLERY if n is None else GALLERY[:n]
    out = []
    for k, c, w, h, alt, cap in items:
        sz = '(max-width:900px) 100vw, 50vw' if c in ('g-xl', 'g-wide') else '(max-width:900px) 50vw, 25vw'
        out.append(f'<figure class="{c}">{pic(R, k, w, h, alt, sz)}<figcaption>{cap}</figcaption></figure>')
    return '<div class="gallery">' + ''.join(out) + '</div>'

# ---------- Общие куски ----------
NAV = [('about/', 'Обо мне'), ('requests/', 'С чем я работаю'), ('services/', 'Форматы и стоимость'),
       ('first-session/', 'Как проходит приём'), ('office-tula/', 'Кабинет в Туле')]
LOCKUP = ('<span class="lockup__prof" aria-hidden="true">клинический психолог · Тула</span>'
          '<span class="lockup__name" aria-hidden="true">Юлия Бердникова</span>'
          '<span class="lockup__center" aria-hidden="true">Центр психологии и развития</span>')

def cta_main(R, cls='btn--gold', text='Записаться на приём'):
    return f'<a class="btn {cls}" href="{R}booking/">{text}</a>' if HAS_CONTACT else ''

def header(R, cur):
    AC = ' aria-current="page"'
    links = ''.join(f'<a href="{R}{u}"{AC if u == cur else ""}>{t}</a>' for u, t in NAV)
    cta = cta_main(R, 'btn--dark')
    return f'''<a class="skip" href="#main">К содержанию</a>
<header class="header"><div class="wrap header__in">
  <a class="lockup" href="{R}" aria-label="Юлия Бердникова, клинический психолог, Тула — на главную">{LOCKUP}</a>
  <div class="header__end">
    {cta_main(R, 'btn--dark btn--compact header__cta')}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Открыть меню">Меню</button>
  </div>
  <nav class="nav" id="nav" aria-label="Основное меню">{links}{cta}</nav>
</div></header>'''

def footer(R):
    TB = ' target="_blank" rel="noopener"'
    contacts = ''.join(f'<li><a href="{E(ch_href(k))}"{TB if k != "phone" else ""}>{fmt_phone(D["phone"]) if k == "phone" else LABEL[k].replace("Написать в ", "")}</a></li>' for k in CH)
    rep = f'<li><a href="{E(D["prodoctorovUrl"])}" target="_blank" rel="noopener">Профиль на ПроДокторов{NEWTAB}</a></li>' if D.get('showReputation') else ''
    legal = f'<p>{E(D["legal"])}</p>' if D.get('legal') else ''
    return f'''<footer class="footer"><div class="wrap footer__grid">
  <div><div class="lockup">{LOCKUP.replace(' aria-hidden="true"', '')}</div></div>
  <div><p class="footer__h">Кабинет</p><p>Тула, проспект Ленина, 85, «Ликёрка»{(", " + E(D["placeDetails"])) if D.get("placeDetails") else ""}</p><p>{E(HOURS)}</p></div>
  <div><p class="footer__h">Связь</p><ul class="footer__list">{contacts or "<li>Запись — по предварительной договорённости</li>"}{rep}</ul></div>
  <div><p class="footer__h">Документы</p><ul class="footer__list"><li><a href="{R}privacy/">Политика обработки персональных данных</a></li></ul>{legal}</div>
</div><div class="wrap footer__bottom"><span>© 2026 Юлия Бердникова</span><span>Помощь прямо сейчас — <a href="tel:112">112</a></span></div></footer>'''

COOKIE = '''<div class="cookie" id="cookie" role="region" aria-label="Согласие на cookie" hidden>
  <p>Аналитика — только с вашего согласия. <a href="{R}privacy/">Подробнее</a></p>
  <div class="cookie__btns"><button class="btn btn--dark btn--sm" type="button" data-cookie="accept">Разрешить аналитику</button><button class="btn btn--dark btn--sm" type="button" data-cookie="decline">Только необходимые</button></div>
</div>'''

def crumbs(R, items):
    li = [f'<li><a href="{R}">Главная</a></li>'] + [f'<li><a href="{R}{u}">{t}</a></li>' if u else f'<li aria-current="page">{t}</li>' for u, t in items]
    return f'<nav class="crumbs" aria-label="Хлебные крошки"><ol>{"".join(li)}</ol></nav>'

def page(path, title, desc, body, cur='', robots=None):
    depth = path.count('/')
    R = '../' * depth
    canon = f'https://{D["domain"]}/{path}' if D.get('domain') else ''
    robots = robots or ('index, follow' if D.get('domain') else 'noindex, nofollow')
    meta_canon = f'<link rel="canonical" href="{canon}">' if canon else ''
    og_img = (f'https://{D["domain"]}/img/og.jpg' if D.get('domain') else f'{R}img/og.jpg')
    ld = json.dumps({"@context": "https://schema.org", "@graph": [
        {"@type": "Person", "@id": "#person", "name": "Юлия Бердникова", "jobTitle": "Клинический психолог",
         "address": {"@type": "PostalAddress", "addressLocality": "Тула", "addressCountry": "RU"}},
        {"@type": "LocalBusiness", "@id": "#place", "name": "Юлия Бердникова · клинический психолог",
         "description": "Консультации психолога очно в Туле и онлайн", "founder": {"@id": "#person"},
         "address": {"@type": "PostalAddress", "streetAddress": "проспект Ленина, 85", "addressLocality": "Тула", "addressCountry": "RU"},
         **({"telephone": "+" + norm_phone(D["phone"])} if D.get("phone") else {})}]}, ensure_ascii=False) if path == '' else None
    body = body.replace('{R}', R)
    doc = f'''<!doctype html>
<html lang="ru" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="{robots}">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
{meta_canon}
<meta property="og:type" content="website"><meta property="og:locale" content="ru_RU">
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:image" content="{og_img}">
<meta name="theme-color" content="#1F2129">
<link rel="icon" href="{R}favicon.ico" sizes="any"><link rel="icon" type="image/png" href="{R}favicon-512.png"><link rel="apple-touch-icon" href="{R}apple-touch-icon.png">
<link rel="preload" href="{R}fonts/cormorant-garamond-cyrillic-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{R}fonts/manrope-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{R}css/style.css">
<script>document.documentElement.classList.replace('no-js','js')</script>
{f'<script type="application/ld+json">{ld}</script>' if ld else ''}
</head>
<body>
{header(R, cur)}
<main id="main" tabindex="-1">
{body}
</main>
{footer(R)}
{COOKIE.replace('{R}', R)}
<script>window.SITE={json.dumps({"metrikaId": D.get("metrikaId")})}</script>
<script src="{R}js/main.js" defer></script>
</body>
</html>
'''
    doc = doc.replace('href=""', 'href="./"')
    out = ROOT / path / 'index.html' if path else ROOT / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding='utf-8')
    return path

def booking_cta(text='Чтобы записаться, напишите или позвоните — я предложу время очно в кабинете или онлайн.'):
    if not HAS_CONTACT:
        return ''
    return f'''<section class="dark cta-final" aria-labelledby="cta-title"><div class="wrap cta-final__in">
  <div><p class="overline">Запись</p><h2 id="cta-title">Записаться на приём</h2><p class="lead on-dark">{text}</p></div>
  {contacts_block()}
</div></section>'''

URGENT = '<div class="note"><strong>Важно</strong><p>Сайт и запись — не круглосуточная экстренная служба. Если есть угроза жизни или безопасности — вашей или другого человека, звоните <a href="tel:112">112</a>.</p></div>'

# ---------- Запросы ----------
REQUESTS = [
 {'slug': 'anxiety', 'card': 'Тревога, страхи и паника', 'short': 'Тревога не отпускает, внезапные приступы паники, страхи, из-за которых приходится чего-то избегать.',
  'title': 'Тревога, страхи, панические атаки — психолог в Туле и онлайн',
  'desc': 'Когда тревога не отпускает, случаются приступы паники или страхи мешают жить. Консультации клинического психолога очно в Туле и онлайн.',
  'h1': 'Когда тревога и страх мешают жить',
  'intro': 'Тревога бывает фоновой — постоянное напряжение и ожидание плохого. Бывает острой — внезапный приступ, когда колотится сердце, не хватает воздуха и кажется, что сейчас случится что-то страшное. Со временем человек начинает избегать мест, дорог, людей — и мир становится уже.',
  'discuss': ['Тревога, которая не отпускает, даже когда всё спокойно', 'Внезапные приступы паники и страх, что они повторятся', 'Страхи, из-за которых приходится отказываться от поездок, встреч, дел', 'Мысли и картинки, от которых не получается отвлечься', 'Страх оценки и желание держаться подальше от людей', 'Постоянная настороженность и невозможность расслабиться'],
  'how': 'Мы разбираемся, как устроена ваша тревога: в каких ситуациях она появляется, что её усиливает и что помогает. Смотрим на убеждения и прошлый опыт, которые могут за ней стоять. Это одно из основных направлений моей работы.',
  'doctor': 'Если физические симптомы — боль в груди, перебои в сердце, головокружение — появились впервые, стоит обратиться к терапевту, чтобы исключить телесные причины. Вопрос о лекарствах решает врач — психиатр или психотерапевт; психолог их не назначает.',
  'faq': [('Можно ли прийти, если я не уверен, что у меня «панические атаки»?', 'Да. Не нужно знать название своего состояния — достаточно рассказать, что с вами происходит.'),
          ('Подходит ли онлайн-формат при тревоге?', 'Да, многим так спокойнее: встреча проходит из привычной обстановки. Формат можно выбрать и поменять позже.')],
  'related': ['relationships', 'grief']},
 {'slug': 'relationships', 'card': 'Отношения и созависимость', 'short': 'Повторяющиеся ссоры, ощущение, что растворяетесь в другом человеке, одиночество рядом с близкими.',
  'title': 'Отношения и созависимость — психолог в Туле и онлайн',
  'desc': 'Сложности в отношениях с партнёром, родителями, детьми, созависимость. Индивидуальные встречи и работа с парой — очно в Туле и онлайн.',
  'h1': 'Когда в отношениях тяжело',
  'intro': 'Бывает, что одни и те же ссоры повторяются годами. Или вы так сильно подстраиваетесь под другого, что перестаёте понимать, чего хотите сами. Или рядом есть люди, а внутри — одиночество.',
  'discuss': ['Ссоры и непонимание с партнёром, родителями или детьми', 'Отношения, в которых вы растворяетесь и теряете себя', 'Одни и те же роли: спасать, обижаться, обвинять', 'Решение остаться или уйти', 'Одиночество — даже когда рядом есть люди', 'Сложности в интимной близости'],
  'how': 'Мы смотрим, какие сценарии повторяются в ваших отношениях и откуда они могут идти. С парой я работаю поэтапно: сначала — индивидуальная встреча с каждым партнёром, затем — совместная встреча пары.',
  'doctor': 'Если в отношениях есть насилие или угроза безопасности, в первую очередь важно позаботиться о защите. При непосредственной угрозе — 112.',
  'faq': [('Можно ли прийти одному, если партнёр не хочет?', 'Да. Работать со своей частью отношений можно и одному.'),
          ('Как проходит работа с парой?', 'Сначала — индивидуальная встреча с каждым партнёром, затем — совместная встреча.')],
  'related': ['anxiety', 'grief']},
 {'slug': 'grief', 'card': 'Утрата и горе', 'short': 'Смерть близкого, развод, расставание — и ощущение, что жизнь остановилась.',
  'title': 'Утрата и горе — психолог Юлия Бердникова, Тула и онлайн',
  'desc': 'Поддержка после смерти близкого, развода или расставания. Без универсальных сроков и оценок. Очно в Туле и онлайн.',
  'h1': 'Когда случилась утрата',
  'intro': 'Смерть близкого человека, развод, расставание меняют жизнь. Горе не проходит по расписанию, и у каждого оно своё: кто-то не может плакать, кто-то не может остановиться, кому-то кажется, что «уже пора бы».',
  'discuss': ['Потеря близкого человека', 'Развод и расставание', 'Чувство вины, злость, оцепенение после утраты', 'Ситуации, которые не получилось завершить и отпустить', 'Как жить дальше и опираться на что-то'],
  'how': 'Я не тороплю и не объясняю, как «правильно» горевать. Мы бережно проживаем то, что случилось, и ищем, на что можно опереться сейчас.',
  'doctor': 'Если появляются мысли о том, что не хочется жить, или кажется, что не справляетесь, — не откладывайте: при угрозе жизни звоните 112. Если сон и аппетит надолго нарушены, может понадобиться консультация врача.',
  'faq': [('Сколько времени должно пройти, прежде чем обращаться?', 'Нет правильного срока. Можно прийти и сразу после утраты, и спустя годы.')],
  'related': ['anxiety', 'relationships']},
 {'slug': 'self-harm', 'card': 'Самоповреждение и зависимое поведение', 'short': 'Желание причинить себе боль, еда, алкоголь или сигареты как способ справиться со стрессом.',
  'title': 'Самоповреждение и зависимое поведение — психолог в Туле',
  'desc': 'Помощь, когда хочется причинить себе боль или справляться со стрессом едой, алкоголем, сигаретами. По записи, очно в Туле и онлайн. Не экстренная служба.',
  'h1': 'Когда справляться приходится через боль',
  'intro': 'Иногда, когда внутри слишком тяжело, человек причиняет себе боль. Или справляется со стрессом едой, алкоголем, сигаретами — и понимает, что это начинает пугать. Об этом трудно говорить, и об этом можно говорить без стыда.',
  'discuss': ['Желание причинить себе боль', 'Еда как способ справляться со стрессом', 'Алкоголь или сигареты, которые помогают «выдохнуть», но тревожат', 'Что происходит перед этим и что помогает остановиться', 'Как говорить об этом с близкими'],
  'how': 'Я работаю с самоповреждающим поведением и принимаю острые обращения — по записи, в часы работы кабинета. Мы спокойно разбираемся, что за этим стоит и какие другие способы справляться можно найти.',
  'doctor': 'Если есть угроза жизни или опасная травма — звоните 112, не ждите записи. При тяжёлой зависимости от алкоголя или других веществ нужна консультация врача — нарколога или психиатра; работа с психологом может идти параллельно.',
  'faq': [('Можно ли написать, если мне плохо прямо сейчас?', 'Я отвечаю в рабочее время. Если вам нужна помощь прямо сейчас — звоните 112.')],
  'related': ['anxiety', 'grief'], 'urgent': True},
]
def reqcard(R, r, link=True):
    h = f'<a href="{R}requests/{r["slug"]}/">{r["card"]}</a>' if link else r['card']
    return f'<article class="rcard"><h3>{h}</h3><p>{r["short"]}</p></article>'
OTHER_GROUPS = [('Эмоции и уверенность в себе', ['Обида, вина или стыд, которые не отпускают', 'Злость, которую трудно сдерживать', 'Настроение резко меняется, и непонятно почему', 'Трудно решиться, сделать выбор или сказать «нет»', 'Ощущение, что вы хуже других']),
                ('Сон, усталость и тело', ['Трудно уснуть или просыпаетесь среди ночи', 'Усталость, которая не проходит после отдыха', 'Тело откликается на напряжение: головные боли, мигрень, желудок, кожа', 'Свет и звуки раздражают сильнее, чем раньше'])]

# ---------- Страницы ----------
def trust(R):
    items = ['<li><span class="trust__value">16 лет</span><span class="trust__label">практики</span></li>',
             '<li><span class="trust__value">Клинический психолог</span><span class="trust__label">консультации взрослых от 18 лет</span></li>',
             '<li><span class="trust__value">Очно и онлайн</span><span class="trust__label">кабинет в Туле и видеосвязь</span></li>']
    if D.get('showAward'):
        items.append(f'<li><span class="trust__value">Премия ПроДокторов 2026</span><span class="trust__label">3-е место · категория «Психолог» · <a href="{E(D["prodoctorovUrl"])}" target="_blank" rel="noopener">источник{NEWTAB}</a></span></li>')
    return '<ul class="trust" aria-label="Коротко обо мне">' + ''.join(items) + '</ul>'

FORMATS = [('В кабинете в Туле', 'Проспект Ленина, 85, «Ликёрка». Спокойное пространство с диваном, креслами и светом из окна.', 'office-tula/'),
           ('Онлайн', 'По видеосвязи — из дома или из другого города.', 'online/'),
           ('Работа с парой', 'Сначала — индивидуальная встреча с каждым партнёром, затем — совместная встреча пары.', 'services/#pair')]
def formats(R):
    return '<div class="steps">' + ''.join(f'<div class="card"><h3><a href="{R}{u}">{t}</a></h3><hr class="rule"><p>{d}</p></div>' for t, d, u in FORMATS) + '</div>'

FIRST = [('Вы рассказываете', 'О ситуации — так, как получается. Готовиться специально не нужно.'),
         ('Я задаю вопросы', 'Чтобы лучше понять, что с вами происходит и что для вас важно.'),
         ('Обсуждаем ожидания', 'Чего вы хотите от работы и как она может быть устроена.'),
         ('Решаем, как дальше', 'Продолжать ли встречи и в каком формате — вы решаете сами.')]
def first(R):
    return '<ol class="flow">' + ''.join(f'<li><h3>{t}</h3><p>{d}</p></li>' for t, d in FIRST) + '</ol>'

FAQ = [('Нужно ли как-то готовиться к первой встрече?', 'Нет. Можно прийти с тем, что есть, даже если сложно сформулировать, что именно беспокоит.'),
       ('Можно ли прийти, если я не понимаю, в чём проблема?', 'Да. Не нужно знать название своего состояния — разбираться будем вместе.'),
       ('Чем онлайн отличается от встречи в кабинете?', 'Содержание работы одинаковое. Онлайн удобен, если вы в другом городе или вам спокойнее дома.'),
       ('Работаете ли вы с парами?', 'Да. Сначала — индивидуальная встреча с каждым партнёром, затем — совместная встреча пары.'),
       ('Можно ли обратиться в остром состоянии?', 'Да, я принимаю острые обращения — по записи, в часы работы кабинета. Это не круглосуточная экстренная помощь: при угрозе жизни или безопасности звоните 112.'),
       ('Есть ли бесплатная первая встреча или скидки?', 'Нет. Первая встреча проходит так же, как и последующие.')]
if D.get('duration'): FAQ.insert(2, ('Сколько длится встреча?', D['duration']))
if D.get('payment'): FAQ.append(('Как оплачивать?', D['payment']))
if D.get('cancellation'): FAQ.append(('Что если нужно перенести или отменить встречу?', D['cancellation']))
def faq(items):
    return '<div class="faq">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in items) + '</div>'

def prices_block():
    if not D.get('prices'): return ''
    rows = ''.join(f'<tr><th scope="row">{E(a)}</th><td>{E(b)}</td></tr>' for a, b in D['prices'])
    return f'<div class="prices"><h3 class="h-sub">Стоимость</h3><table><caption class="sr-only">Стоимость консультаций</caption><tbody>{rows}</tbody></table></div>'

def methods_block():
    if not D.get('showMethods'): return ''
    return '<div class="methods"><h3 class="h-sub">Подходы, на которые я опираюсь</h3><dl>' + ''.join(f'<dt>{E(a)}</dt><dd>{E(b)}</dd>' for a, b in D['methods']) + '</dl></div>'

def section(id_, title, inner, over='', cls='', lead=''):
    o = f'<p class="overline">{over}</p>' if over else ''
    l = f'<p class="lead">{lead}</p>' if lead else ''
    return f'<section class="{cls}" id="{id_}" aria-labelledby="{id_}-t"><div class="wrap"><div class="head"><div>{o}<h2 id="{id_}-t">{title}</h2></div>{l}</div>{inner}</div></section>'

built = []
# Главная
hero = f'''<section class="hero" aria-labelledby="h1"><div class="wrap hero__grid"><div>
  <p class="overline">Частная практика · Тула и онлайн</p>
  <h1 id="h1">Когда тревога, страхи или панические атаки мешают жить, можно начать с&nbsp;разговора</h1>
  <p class="lead">Меня зовут Юлия Бердникова. Я клинический психолог, 16&nbsp;лет работаю со взрослыми. Принимаю очно в&nbsp;Туле и&nbsp;онлайн.</p>
  <div class="btns">{cta_main('{R}')}<a class="btn {'btn--dark' if HAS_CONTACT else 'btn--gold'}" href="{{R}}first-session/">Как проходит первая встреча</a></div>
</div><div class="hero__photo">{pic('{R}', 'portrait-hero', 3788, 5694, 'Юлия Бердникова в кабинете, сидит в кресле на фоне графитовых штор', '(max-width:900px) 100vw, 40vw', lazy=False)}</div></div>
<div class="wrap">{trust('{R}')}</div></section>'''
rep = ''
if D.get('showReputation'):
    rep = section('reviews', 'Отзывы', f'<p class="lead">На ПроДокторов: рейтинг {D["prodoctorovRating"]}, {D["prodoctorovReviews"]} (по данным на {D["prodoctorovChecked"]}).</p><div class="btns"><a class="btn btn--dark" href="{E(D["prodoctorovUrl"])}" target="_blank" rel="noopener">Читать отзывы на ПроДокторов{NEWTAB}</a></div>', 'Репутация')
home = hero + \
  section('requests', 'С чем ко мне приходят', '<div class="rgrid">' + ''.join(reqcard('{R}', r) for r in REQUESTS) + '<article class="rcard"><h3><a href="{R}requests/">Эмоции, уверенность, сон и тело</a></h3><p>Обида, вина, перепады настроения, усталость, бессонница, напряжение в теле.</p></article><article class="rcard"><h3><a href="{R}online/">Психолог онлайн</a></h3><p>Если вы в другом городе или вам удобнее встречаться из дома.</p></article></div>', 'Запросы', 'white', 'Не нужно знать, как называется ваше состояние. Достаточно рассказать, что с вами происходит.') + \
  section('formats', 'Форматы встреч', formats('{R}'), 'Формат', '', 'Встречи — по предварительной записи.') + \
  section('first', 'Как проходит первая встреча', first('{R}') + '<p class="more"><a href="{R}first-session/">Подробнее о первой встрече</a></p>', 'Первая встреча', 'white', 'Я не обещаю результат или число встреч заранее — это зависит от вашей ситуации.') + \
  f'''<section id="about" aria-labelledby="about-t"><div class="wrap about__grid"><div class="about__photo">{pic('{R}', 'portrait-about', 3759, 5650, 'Портрет Юлии Бердниковой в кабинете', '(max-width:900px) 100vw, 35vw')}</div><div>
  <p class="overline">Обо мне</p><h2 id="about-t">Мой опыт и подходы</h2><hr class="rule">
  <p>Я принимаю взрослых очно в своём кабинете в Туле и онлайн — в том числе тех, кто живёт в другом городе. Работаю безоценочно и в вашем темпе.</p>
  {methods_block()}<p class="more"><a href="{{R}}about/">Подробнее обо мне</a></p></div></div></section>''' + \
  f'<section class="dark" id="space" aria-labelledby="space-t"><div class="wrap"><p class="overline">Кабинет</p><h2 id="space-t">Кабинет в «Ликёрке»</h2><p class="lead on-dark">Тула, проспект Ленина, 85. Здесь проходят очные встречи.</p>{gallery("{R}", 6)}<p class="more on-dark"><a href="{{R}}office-tula/">Как добраться и все фото кабинета</a></p></div></section>' + \
  (section('price', 'Стоимость и условия', prices_block() + '<p class="more"><a href="{R}services/">Все форматы и условия</a></p>', 'Стоимость') if D.get('prices') else '') + \
  rep + section('faq', 'Частые вопросы', faq(FAQ[:4]) + '<p class="more"><a href="{R}faq/">Все вопросы</a></p>', 'FAQ', 'white') + booking_cta()
built.append(page('', 'Клинический психолог в Туле и онлайн — Юлия Бердникова',
     'Юлия Бердникова — клинический психолог, 16 лет практики. Тревога, страхи, панические атаки, отношения, эмоциональное состояние. Очно в Туле («Ликёрка») и онлайн. Посмотрите форматы и условия приёма.', home))

# Обо мне
about = crumbs('{R}', [(None, 'Обо мне')]) + f'''<section class="page-hero"><div class="wrap about__grid"><div class="about__photo">{pic('{R}', 'portrait-about', 3759, 5650, 'Портрет Юлии Бердниковой в кабинете', '(max-width:900px) 100vw, 35vw', lazy=False)}</div><div>
<h1>Обо мне</h1><hr class="rule">
<p class="lead">Я клинический психолог, практикую 16 лет. Принимаю взрослых от 18 лет — очно в своём кабинете в Туле и онлайн.</p>
<p>Ко мне приходят с разным: со страхами и паническими атаками, с бессонницей, со сложностями в отношениях, с ощущением, что потерялись. Вместе мы разбираемся, что стоит за этим состоянием, — в вашем темпе.</p>
<h2 class="h-sub mt">Как я работаю</h2><ul class="principles"><li><h3>Без оценок</h3><p>Здесь можно говорить о чём угодно — без осуждения.</p></li><li><h3>Без давления</h3><p>Решение о продолжении встреч всегда за вами.</p></li><li><h3>Бережно к трудным темам</h3><p>Я работаю с острыми состояниями и самоповреждающим поведением — по записи.</p></li></ul>
{methods_block()}
{('<div class="methods"><h3 class="h-sub">Образование</h3><ul>' + ''.join(f'<li>{E(x)}</li>' for x in D['education']) + '</ul></div>') if D.get('education') else ''}
{(f'<p class="more"><a href="{E(D["prodoctorovUrl"])}" target="_blank" rel="noopener">Профиль на ПроДокторов{NEWTAB}</a></p>') if D.get('showReputation') else ''}
<div class="btns">{cta_main('{R}')}<a class="btn btn--dark" href="{{R}}requests/">С чем я работаю</a></div>
</div></div></section>''' + booking_cta()
built.append(page('about/', 'О Юлии Бердниковой — клинический психолог в Туле', 'Я Юлия Бердникова, клинический психолог, 16 лет практики. Принимаю взрослых очно в Туле и онлайн. Как я работаю и на какие подходы опираюсь.', about, 'about/'))

# Запросы — хаб
others = ''.join(f'<article class="rcard rcard--plain"><h3>{t}</h3><ul>' + ''.join(f'<li>{x}</li>' for x in items) + '</ul></article>' for t, items in OTHER_GROUPS)
hub = crumbs('{R}', [(None, 'С чем я работаю')]) + f'''<section class="page-hero"><div class="wrap"><h1>С чем ко мне приходят</h1><p class="lead">Не нужно знать, как называется ваше состояние. Здесь — частые переживания, с которыми ко мне обращаются. Если вашего нет в списке, всё равно можно написать.</p></div></section>
<section class="white" aria-labelledby="hub-main"><div class="wrap"><h2 id="hub-main" class="h-sub">Подробно по темам</h2><div class="rgrid">{''.join(reqcard('{R}', r) for r in REQUESTS)}<article class="rcard"><h3><a href="{{R}}online/">Психолог онлайн</a></h3><p>Если вы в другом городе или вам удобнее встречаться из дома.</p></article></div></div></section>
<section aria-labelledby="hub-other"><div class="wrap"><h2 id="hub-other" class="h-sub">Также приходят с этим</h2><div class="rgrid rgrid--2">{others}</div>
{'<div class="rcard rcard--dark"><h3>Заключение перед ЭКО</h3><p>' + E(D['ivf']) + '</p></div>' if D.get('ivf') else ''}
</div></section>''' + booking_cta()
built.append(page('requests/', 'С чем работает психолог Юлия Бердникова — Тула и онлайн', 'Тревога, страхи, панические атаки, отношения, утрата, эмоции, сон и усталость. С чем приходят к клиническому психологу Юлии Бердниковой в Туле и онлайн.', hub, 'requests/'))

# Страницы запросов
BY = {r['slug']: r for r in REQUESTS}
for r in REQUESTS:
    rel = ''.join(reqcard('{R}', BY[s]) for s in r['related']) + '<article class="rcard"><h3><a href="{R}online/">Психолог онлайн</a></h3><p>Встречи по видеосвязи.</p></article>'
    body = crumbs('{R}', [('requests/', 'С чем я работаю'), (None, r['card'])]) + f'''<section class="page-hero"><div class="wrap narrow"><h1>{r['h1']}</h1><p class="lead">{r['intro']}</p>
<div class="btns">{cta_main('{R}')}<a class="btn btn--dark" href="{{R}}services/">Форматы и стоимость</a></div></div></section>
{('<div class="wrap narrow urgent-top">' + URGENT + '</div>') if r.get('urgent') else ''}
<section class="white" aria-labelledby="d-t"><div class="wrap narrow"><h2 id="d-t">Что можно обсудить</h2><ul class="ticks">{''.join(f'<li>{x}</li>' for x in r['discuss'])}</ul></div></section>
<section aria-labelledby="h-t"><div class="wrap narrow"><h2 id="h-t">Как я работаю с этой темой</h2><p>{r['how']}</p><p>На первой встрече вы рассказываете о ситуации, я задаю вопросы, мы обсуждаем ожидания и вместе решаем, как двигаться дальше. <a href="{{R}}first-session/">Подробнее о первой встрече</a>.</p>
<h2 class="mt">Когда нужен врач или другой специалист</h2><p>{r['doctor']}</p></div></section>
<section class="white" aria-labelledby="f-t"><div class="wrap narrow"><h2 id="f-t">Вопросы</h2>{faq(r['faq'])}</div></section>
<section aria-labelledby="r-t"><div class="wrap"><h2 id="r-t" class="h-sub">Смежные темы</h2><div class="rgrid">{rel}</div></div></section>''' + booking_cta()
    built.append(page(f'requests/{r["slug"]}/', r['title'], r['desc'], body, 'requests/'))

# Онлайн
online = crumbs('{R}', [('services/', 'Форматы и стоимость'), (None, 'Психолог онлайн')]) + f'''<section class="page-hero"><div class="wrap narrow"><h1>Психолог онлайн</h1><p class="lead">Встречи по видеосвязи — для тех, кто живёт в другом городе или другой стране, кому трудно добраться до кабинета или спокойнее разговаривать из дома.</p>
<div class="btns">{cta_main('{R}')}<a class="btn btn--dark" href="{{R}}services/">Все форматы</a></div></div></section>
<section class="white" aria-labelledby="o1"><div class="wrap narrow"><h2 id="o1">Кому подходит</h2><ul class="ticks"><li>Вы живёте не в Туле — в другом городе или за рубежом</li><li>Вам трудно выбраться из дома или выделить время на дорогу</li><li>Вам спокойнее говорить из привычной обстановки</li><li>Вы уже ходите на очные встречи, но иногда нужно встретиться онлайн</li></ul></div></section>
<section aria-labelledby="o2"><div class="wrap narrow"><h2 id="o2">Как это устроено</h2><p>Содержание работы такое же, как в кабинете. Для встречи нужны стабильный интернет, наушники и место, где вас никто не услышит. Время встречи согласуем при записи; если вы в другом часовом поясе — учтём это.</p>
<h2 class="mt">Когда лучше прийти очно</h2><p>Если дома нет возможности говорить без посторонних — иногда удобнее встречаться в кабинете в Туле. <a href="{{R}}office-tula/">Как добраться</a>.</p></div></section>''' + booking_cta()
built.append(page('online/', 'Психолог онлайн — Юлия Бердникова, клинический психолог', 'Консультации клинического психолога Юлии Бердниковой по видеосвязи: для жителей других городов и стран. Как устроены онлайн-встречи и как записаться.', online, 'services/'))

# Форматы и стоимость
dur = f'<p class="muted">Длительность: {E(D["duration"])}</p>' if D.get('duration') else ''
ivf = f'<div class="card card--dark" id="ivf"><h3>Заключение перед ЭКО</h3><hr class="rule"><p>{E(D["ivf"])}</p></div>' if D.get('ivf') else ''
rules = ''.join(f'<h3 class="h-sub">{t}</h3><p>{E(D[k])}</p>' for k, t in [('payment', 'Оплата'), ('cancellation', 'Перенос и отмена')] if D.get(k))
services = crumbs('{R}', [(None, 'Форматы и стоимость')]) + f'''<section class="page-hero"><div class="wrap"><h1>Форматы и стоимость</h1><p class="lead">Встречи проходят по предварительной записи — в кабинете в Туле или онлайн. Бесплатных вводных сессий и скидок за знакомство нет: первая встреча проходит так же, как следующие.</p></div></section>
<section class="white" aria-labelledby="s1"><div class="wrap"><h2 id="s1" class="sr-only">Форматы</h2><div class="steps">
<div class="card"><h3>В кабинете в Туле</h3><hr class="rule"><p>Индивидуальная встреча. Тула, проспект Ленина, 85, «Ликёрка».</p><p class="more"><a href="{{R}}office-tula/">Кабинет и маршрут</a></p></div>
<div class="card"><h3>Онлайн</h3><hr class="rule"><p>По видеосвязи — из дома или из другого города.</p><p class="more"><a href="{{R}}online/">Подробнее</a></p></div>
<div class="card" id="pair"><h3>Работа с парой</h3><hr class="rule"><p>Сначала — индивидуальная встреча с каждым партнёром, затем — совместная встреча пары. Сказанное на индивидуальной встрече не пересказывается партнёру без вашего согласия.</p></div>
{ivf}</div>{dur}{prices_block()}{rules}
<div class="btns">{cta_main('{R}')}<a class="btn btn--dark" href="{{R}}first-session/">Как проходит первая встреча</a></div></div></section>''' + booking_cta()
built.append(page('services/', 'Форматы и стоимость — психолог Юлия Бердникова', 'Очные встречи в кабинете в Туле, онлайн по видеосвязи, работа с парой. Условия приёма клинического психолога Юлии Бердниковой.', services, 'services/'))

# Первая встреча
fs = crumbs('{R}', [(None, 'Как проходит приём')]) + f'''<section class="page-hero"><div class="wrap narrow"><h1>Как проходит первая встреча</h1><p class="lead">Первая встреча — это знакомство. Готовиться специально не нужно, и можно прийти, даже если трудно сформулировать, что беспокоит.</p></div></section>
<section class="white" aria-labelledby="fs1"><div class="wrap"><h2 id="fs1" class="sr-only">Шаги</h2>{first('{R}')}</div></section>
<section aria-labelledby="fs2"><div class="wrap narrow"><h2 id="fs2">Чего ожидать</h2><p>Я не обещаю результат или конкретное число встреч заранее: это зависит от вашей ситуации и того, чего вы хотите. Решение продолжать встречи всегда за вами.</p>
{f'<p>Длительность встречи — {E(D["duration"])}.</p>' if D.get('duration') else ''}
<h2 class="mt">Острые обращения</h2><p>Я принимаю острые обращения — по записи, в часы работы кабинета.</p>{URGENT}
<div class="btns">{cta_main('{R}')}<a class="btn btn--dark" href="{{R}}faq/">Частые вопросы</a></div></div></section>''' + booking_cta()
built.append(page('first-session/', 'Как проходит первая встреча с психологом — Юлия Бердникова', 'Что происходит на первой встрече с клиническим психологом Юлией Бердниковой, нужно ли готовиться и как принимается решение о продолжении.', fs, 'first-session/'))

# Кабинет
route = ''
if D.get('route'):
    route = '<ol class="route-steps">' + ''.join(f'<li><b>{E(a)}</b><span>{E(b)}</span></li>' for a, b in D['route']) + '</ol>'
maps = ''.join(f'<a class="btn btn--dark" href="{E(D[k])}" target="_blank" rel="noopener">{t}{NEWTAB}</a>' for k, t in [('yandexMapUrl', 'Яндекс Карты'), ('gisMapUrl', '2ГИС')] if D.get(k))
office = crumbs('{R}', [(None, 'Кабинет в Туле')]) + f'''<section class="page-hero"><div class="wrap narrow"><h1>Кабинет в Туле</h1><p class="lead">Тула, проспект Ленина, 85, «Ликёрка»{(", " + E(D["placeDetails"])) if D.get("placeDetails") else ""}.</p>
<dl class="facts-list"><dt>Часы</dt><dd>{E(HOURS)}</dd><dt>Формат</dt><dd>Очные индивидуальные встречи и встречи пар</dd></dl>
{route}{('<div class="btns">' + maps + '</div>') if maps else ''}</div></section>
<section class="dark" aria-labelledby="g-t"><div class="wrap"><h2 id="g-t">Пространство</h2>{gallery('{R}')}</div></section>''' + booking_cta()
built.append(page('office-tula/', 'Кабинет психолога в Туле, «Ликёрка» — Юлия Бердникова', 'Кабинет клинического психолога Юлии Бердниковой: Тула, проспект Ленина, 85, «Ликёрка». Фото пространства и как добраться.', office, 'office-tula/'))

# FAQ
fq = crumbs('{R}', [(None, 'Частые вопросы')]) + f'''<section class="page-hero"><div class="wrap narrow"><h1>Частые вопросы</h1></div></section>
<section class="white" aria-labelledby="fq"><div class="wrap narrow"><h2 id="fq" class="sr-only">Вопросы и ответы</h2>{faq(FAQ)}{URGENT}</div></section>''' + booking_cta()
built.append(page('faq/', 'Частые вопросы — психолог Юлия Бердникова, Тула и онлайн', 'Ответы на частые вопросы перед первой встречей с клиническим психологом Юлией Бердниковой: подготовка, онлайн и очно, пары, острые обращения.', fq))

# Запись
if HAS_CONTACT:
    bk_inner = f'<p class="lead">Напишите или позвоните — я предложу время очно в кабинете или онлайн. Отвечаю в рабочее время.</p>{contacts_block()}'
else:
    bk_inner = '<p class="lead">Запись — по предварительной договорённости. Способы связи появятся на этой странице после подключения рабочего номера.</p>'
bk = crumbs('{R}', [(None, 'Запись')]) + f'''<section class="page-hero"><div class="wrap narrow"><h1>Запись на приём</h1>{bk_inner}
<p class="muted">В сообщении достаточно написать, что вы хотите записаться и какой формат удобнее — очно или онлайн. Подробности о своём состоянии писать не нужно.</p>{URGENT}</div></section>'''
built.append(page('booking/', 'Запись на приём к психологу Юлии Бердниковой', 'Как записаться к клиническому психологу Юлии Бердниковой — очно в Туле или онлайн.', bk))

# Политика
pv = crumbs('{R}', [(None, 'Политика обработки персональных данных')]) + '''<section class="page-hero"><div class="wrap narrow"><h1>Политика обработки персональных данных</h1>
<p>На сайте нет форм: через сайт не собираются имена, телефоны и сведения о здоровье. Связь — через мессенджеры и по телефону.</p>
<p>Сайт использует технически необходимые данные браузера (например, запоминает ваш выбор в баннере cookie). Веб-аналитика (Яндекс Метрика) подключается только после вашего согласия; отказаться можно в баннере.</p>
<p class="muted">Полный текст политики будет опубликован после согласования с юристом.</p></div></section>'''
built.append(page('privacy/', 'Политика обработки персональных данных — Юлия Бердникова', 'Как сайт Юлии Бердниковой обрабатывает данные: без форм, аналитика только с согласия.', pv, robots='noindex, follow'))

# 404
nf = '''<section class="page-hero"><div class="wrap narrow"><h1>Страница не найдена</h1><p class="lead">Возможно, адрес изменился. Начните с главной или выберите раздел в меню.</p><div class="btns"><a class="btn btn--dark" href="{R}">На главную</a></div></div></section>'''
page('404', 'Страница не найдена — Юлия Бердникова', 'Страница не найдена.', nf, robots='noindex')
p404 = ROOT / '404' / 'index.html'; txt = p404.read_text(encoding='utf-8').replace('href="../', 'href="/berdnikova-site/' if not D.get('domain') else 'href="/').replace('src="../', 'src="/berdnikova-site/' if not D.get('domain') else 'src="/').replace('srcset="../', 'srcset="/berdnikova-site/' if not D.get('domain') else 'srcset="/')
(ROOT / '404.html').write_text(txt, encoding='utf-8'); p404.unlink(); p404.parent.rmdir()

# sitemap и robots
base = f'https://{D["domain"]}/' if D.get('domain') else None
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ''.join(f'  <url><loc>{(base or "https://ДОМЕН/") + p}</loc></url>\n' for p in built if p != 'privacy/') + '</urlset>\n', encoding='utf-8')
(ROOT / 'robots.txt').write_text(('User-agent: *\nAllow: /\nSitemap: ' + base + 'sitemap.xml\n') if base else
    '# Тестовый адрес закрыт от индексации. После подключения домена укажите "domain" в _build/site.json и пересоберите.\nUser-agent: *\nDisallow: /\n', encoding='utf-8')
print('pages:', len(built) + 1, '| contacts:', CH or 'нет', '| indexable:', bool(base))
