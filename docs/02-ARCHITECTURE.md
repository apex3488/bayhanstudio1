# BAYHAN STUDIO 2.0 — архитектура

Статус: **реализовано**. Актуальная структура папок — в [README](../README.md#структура). Отличия от исходного предложения: id маршрутов вынесены в `src/app/routeIds.ts` (страницы импортируют id, реестр импортирует страницы — без циклов); секции главной лежат в `src/sections/`; клиент загружает только словарь текущего языка (`src/content/load.ts`), сервер — все три.

## Принципы

1. **Статический HTML на каждую страницу** (SSG при сборке) → GitHub Pages отдаёт реальный файл на любой прямой URL, без 404-хаков и rewrite.
2. **Контент ≠ представление**: компоненты получают тексты из типизированных словарей.
3. **3D — прогрессивное улучшение**: сайт полностью работает без него.
4. **Маленькие компоненты с одной задачей**, без «бога-компонента» `App`.

## Структура папок

```
bayhan-studio/
├─ .github/workflows/deploy.yml     # build + deploy в GitHub Pages
├─ public/
│  ├─ favicon.svg, og/*.jpg         # статические ассеты (копируются как есть)
│  └─ .nojekyll
├─ scripts/
│  ├─ prerender.ts                  # рендер всех маршрутов × языков в dist/
│  └─ validate-build.ts             # проверка ссылок, meta, lang, hreflang
├─ src/
│  ├─ entry-client.tsx              # hydrateRoot для текущей страницы
│  ├─ entry-server.tsx              # renderPage(route, locale) → { html, head }
│  ├─ app/
│  │  ├─ routes.ts                  # единый реестр маршрутов (id, path, page, meta-ключи)
│  │  ├─ Document.tsx               # каркас: Header, main, Footer
│  │  └─ paths.ts                   # href(routeId, locale) с учётом BASE_URL
│  ├─ i18n/
│  │  ├─ locales.ts                 # ['ru','en','uz'], default, hreflang-коды
│  │  ├─ LocaleContext.tsx          # useLocale(), useT()
│  │  └─ types.ts                   # type Dictionary
│  ├─ content/
│  │  ├─ ru.ts  en.ts  uz.ts        # все тексты (satisfies Dictionary)
│  │  ├─ services.ts                # id, slug, иконка/визуал — без текста
│  │  └─ contacts.ts                # единственный источник реальных URL
│  ├─ pages/
│  │  ├─ HomePage.tsx  ServicesPage.tsx  ServiceDetailPage.tsx
│  │  ├─ ContactPage.tsx  PrivacyPage.tsx  NotFoundPage.tsx
│  ├─ sections/                     # секции главной: Hero, Manifesto, Services, Process, Why, ContactCta
│  ├─ components/                   # Button, MagneticLink, LangSwitch, Header, Footer, Preloader, SkipLink…
│  ├─ features/
│  │  ├─ brief-form/                # BriefForm, validation.ts, buildMessage.ts, telegramLink.ts
│  │  └─ robot/
│  │     ├─ RobotStage.tsx          # решает: постер или 3D (capability check)
│  │     ├─ RobotCanvas.tsx         # lazy: <Canvas>, свет, окружение
│  │     ├─ SentinelHead.tsx        # процедурная модель (реализует RobotModel)
│  │     ├─ useCapability.ts        # WebGL2, reduced motion, Save-Data, deviceMemory
│  │     └─ RobotPoster.tsx         # <picture> AVIF/WebP fallback
│  ├─ motion/
│  │  ├─ tokens.ts                  # длительности, easing, stagger
│  │  ├─ gsap.ts                    # регистрация плагинов один раз
│  │  └─ useReveal.ts, useKinetic.ts, useMagnetic.ts
│  └─ styles/
│     ├─ tokens.css                 # цвета, типографика, отступы, z-index
│     ├─ base.css  fonts.css
│     └─ *.module.css рядом с компонентами
├─ tests/                           # Playwright (если согласовано)
├─ index.html                       # шаблон для пререндера
├─ vite.config.ts                   # base из env SITE_BASE
└─ README.md
```

## Сборка

```
vite build                    → dist/ (клиентские чанки с хэшами)
vite build --ssr entry-server → dist-ssr/
node scripts/prerender        → для каждого (route × locale):
                                 renderToString(<Page/>) + head (title, description,
                                 lang, canonical, hreflang, og) → dist/{lang}/{path}/index.html
                                 + dist/index.html (выбор языка) + dist/404.html
node scripts/validate-build   → падает при битых ссылках / пустых meta / href="#"
```

## Base path

- `vite.config.ts`: `base: process.env.SITE_BASE ?? '/'`.
- Для `username.github.io/repo/` → `SITE_BASE=/repo/` задаётся в workflow.
- Все внутренние ссылки строятся только через `href()` из `paths.ts` (использует `import.meta.env.BASE_URL`), ассеты — через импорты или `BASE_URL`. Никаких «голых» `/ru/...`.

## Гидрация

Каждая страница — отдельный остров React на `<div id="root">`. Клиент читает `data-route` и `data-locale` из `<html>` и гидрирует ту же страницу. Тяжёлые части (робот, ScrollTrigger-сцены) инициализируются только в `useEffect` → совпадение SSR/CSR гарантировано.

## Расширяемость

- Новая услуга: запись в `services.ts` + тексты в 3 словарях → страница и навигация появляются автоматически; `tsc` не пропустит без переводов.
- Новая страница: запись в `routes.ts` + компонент.
- Новый язык: файл словаря + запись в `locales.ts`.
- GLB-модель: новый компонент, реализующий `RobotModel`, подключается в `RobotCanvas`.
- Backend для заявок: замена `telegramLink.ts` на `submitBrief()` без изменения UI формы.
