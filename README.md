# BAYHAN STUDIO — сайт студии

Трёхъязычный (RU / EN / UZ) сайт технологической digital-студии в эстетике
Neo-Greek Futurism. Художественная концепция — в [ART_DIRECTION.md](ART_DIRECTION.md).

## Стек

| Что | Зачем |
|---|---|
| **Next.js 16** (App Router, TypeScript) | статическая генерация всех страниц, локализованные URL, метаданные, бесплатный деплой на Vercel |
| **Three.js** (без обёрток) | полный контроль над рендер-циклом, качеством и освобождением GPU-ресурсов; собственные GLSL-шейдеры |
| **GSAP** + ScrollTrigger + SplitText | вся анимация интерфейса и привязка к прокрутке |
| **Lenis** | сглаживание нативного скролла (не перехватывает его) |
| Собственный CSS (`src/styles/globals.css`) | дизайн слишком специфичен для утилитарного фреймворка; ноль лишних зависимостей |

Платных API, шрифтов и сервисов нет. Шрифты (Unbounded, Cormorant, Onest, JetBrains Mono) —
SIL OFL, подключаются через `next/font` и раздаются с того же домена.

## Команды

```bash
npm install      # зависимости
npm run dev      # разработка: http://localhost:3000
npm run build    # production-сборка
npm run start    # запуск собранной версии
npm run lint     # ESLint
npm run typecheck
```

> Если `npm install` падает с `ENOSPC`, проверьте диск, на котором лежит кэш npm
> (`npm config get cache`). Можно временно указать другой:
> `npm install --cache C:\npm-cache-tmp`.

## Структура

```
src/
  app/[locale]/        страницы: главная, about, services, work, work/[slug], contact, 404
  app/api/lead/        серверный маршрут заявки (работает только при заданных переменных)
  app/sitemap.ts, robots.ts, icon.svg
  proxy.ts             редирект на язык по cookie / Accept-Language
  i18n/                конфигурация языков и словари ru / en / uz
  content/data.ts      услуги и проекты (тип: real | concept)
  components/          оболочка, меню, курсор, форма, чертёжные плиты (SVG)
  lib/motion.ts        декларативные анимации по data-атрибутам
  three/               движок, материалы и геометрия, пять сцен
  styles/globals.css   токены и базовые стили
  styles/v2.css        типографика Unbounded и технологичный слой
public/work/         скриншоты проектов
public/models/bust/    CC0-модель бюста (Poly Haven) + LICENSE.txt
```

### Как добавить проект

1. В `src/content/data.ts` добавьте запись в `projects` (и slug в тип `ProjectSlug`):
   ссылка, статус (`live` / `demo`), платформы и скриншот в `public/work/`.
2. В каждом словаре (`src/i18n/dictionaries/*.ts`) добавьте тексты в `projects`.
   TypeScript не даст собрать проект, пока перевод не появится во всех трёх языках.

### Анимации

Страницы — серверные компоненты; движение задаётся атрибутами:

| Атрибут | Эффект |
|---|---|
| `data-split="lines" \| "chars"` | текст поднимается из-под маски |
| `data-scrub` | слова проявляются по мере прокрутки |
| `data-reveal` / `="clip"` / `="line"` / `="stagger"` | появление, раскрытие маской, линия, каскад |
| `data-draw` (на `<svg>`) | вычерчивание контуров |
| `data-parallax="0.2"` | параллакс |
| `data-hero` | проигрывается сразу после перехода, а не по скроллу |

При `prefers-reduced-motion` скриптовая анимация и Lenis отключаются, контент
виден сразу, сцены рендерят один статичный кадр. Без WebGL вместо сцены
остаётся чертёжная плита.

## Форма заявки

- **По умолчанию** (переменные не заданы): форма собирает текст заявки и открывает
  Telegram `@APEX348` с готовым сообщением. Ничего никуда не отправляется без
  действия пользователя.
- **С прямой отправкой**: задайте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
  (см. `.env.example`). Тогда форма отправляет заявку через `/api/lead` в
  Telegram Bot API. Токен живёт только на сервере.

## Деплой на Vercel (бесплатный план)

1. Загрузите проект в репозиторий GitHub / GitLab / Bitbucket.
2. На vercel.com → **Add New → Project** → выберите репозиторий. Фреймворк
   определится автоматически, настройки сборки менять не нужно.
3. (Необязательно) в **Settings → Environment Variables** добавьте:
   - `NEXT_PUBLIC_SITE_URL` — адрес сайта со своим доменом, например `https://example.com`.
     Без неё используется production-адрес Vercel;
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — для прямой отправки заявок.
4. **Deploy**.

Либо через CLI: `npx vercel` (предпросмотр) и `npx vercel --prod`.

## Лицензии ассетов

- Модель бюста: *Marble Bust 01*, Rico Cilliers, Poly Haven — CC0 1.0
  (`public/models/bust/LICENSE.txt`). Используются геометрия и карта нормалей.
- Вся архитектура сцен (колонны, капители, антаблемент, арка) создаётся кодом.
