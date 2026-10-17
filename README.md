# BAYHAN STUDIO

Официальный сайт BAYHAN STUDIO — статический многоязычный сайт (RU / EN / UZ) на React, TypeScript и Vite с процедурной 3D-сценой на Three.js, публикуемый на GitHub Pages.

Проектная документация: [docs/01-PROJECT-PLAN.md](docs/01-PROJECT-PLAN.md), [docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md), [docs/03-CONTENT.md](docs/03-CONTENT.md).

## Что внутри

- **29 статических страниц**: главная, обзор услуг, 5 страниц услуг, бриф, конфиденциальность — каждая на трёх языках, плюс страница выбора языка и трёхъязычная 404.
- **Робот «Sentinel»** — процедурная голова на Three.js / React Three Fiber, без внешних моделей и текстур. Загружается только после показа hero и только на подходящих устройствах; в остальных случаях показывается постер `public/robot/poster.webp`, отрендеренный из той же сцены.
- **Анимации** на GSAP (ScrollTrigger, SplitText), все через `gsap.matchMedia()`: при `prefers-reduced-motion` движение отключается, контент остаётся.
- **Бриф** без сервера: форма собирает текст, показывает его целиком и передаёт в Telegram (`t.me/APEX348?text=…` + копирование в буфер) или копирует для Instagram. Сайт никогда не пишет, что заявка доставлена.

## Требования

- Node.js 24 LTS (минимум 22.18: скрипты сборки на TypeScript запускаются Node напрямую)
- npm

## Команды

| Команда                                 | Что делает                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm install`                           | установка зависимостей                                                                                            |
| `npm run dev`                           | dev-сервер; страницы рендерятся так же, как в production: http://localhost:5173/ru/                               |
| `npm run build`                         | клиентская сборка → SSR-сборка → пререндер всех страниц → проверка результата                                     |
| `npm run preview`                       | раздача `dist/` с поведением GitHub Pages (`/ru` → `/ru/`, неизвестный путь → `404.html`): http://localhost:4173/ |
| `npm run typecheck` / `lint` / `format` | проверки кода                                                                                                     |
| `npm run contrast`                      | проверка контраста пар цветов из `src/styles/tokens.css` по WCAG AA                                               |
| `npm run check`                         | все проверки + сборка                                                                                             |

## Как устроена сборка

Каждая страница пререндерится в отдельный файл (`dist/ru/services/websites/index.html` и т. д.), поэтому прямой переход и обновление работают на GitHub Pages без серверных правил. Корень `/` перенаправляет на сохранённый язык или язык браузера (по умолчанию — русский) и без JavaScript показывает ссылки на все три языка.

`scripts/validate-build.ts` останавливает сборку при битых внутренних ссылках, ссылках без base path, пустых или повторяющихся `title`, отсутствующих `description` / `canonical` / `hreflang`, ссылках-заглушках и внешних ссылках вне списка реальных контактов (`src/content/contacts.ts`).

### Base path

| Переменная    | Пример                       | По умолчанию            |
| ------------- | ---------------------------- | ----------------------- |
| `SITE_BASE`   | `/bayhan-studio/`            | `/`                     |
| `SITE_ORIGIN` | `https://apex3488.github.io` | `http://localhost:4173` |

Проверка сборки с подпутём локально (PowerShell):

```powershell
$env:SITE_BASE = '/repo-name/'; npm run build; npm run preview
```

Затем откройте http://localhost:4173/repo-name/. В GitHub Actions оба значения берутся из `actions/configure-pages`, поэтому имя репозитория в коде не захардкожено.

## Публикация на GitHub Pages

1. Создайте на GitHub **новый пустой** репозиторий (например, `bayhan-studio`). Текущий сайт `bayhanstudio` не трогайте до приёмки.
2. Отправьте код:
   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
3. В репозитории: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Каждый push в `main` запускает `.github/workflows/deploy.yml`: typecheck → lint → contrast → build → deploy. Ход — во вкладке **Actions**.
5. Сайт откроется по адресу `https://<user>.github.io/<repo>/` (HTTPS для `github.io` включён автоматически). Для собственного домена укажите его в **Settings → Pages → Custom domain** и включите **Enforce HTTPS**; base path переключится на `/` сам.
6. После публикации обновите ссылку в био Telegram `@APEX348` (сейчас там адрес, который отдаёт 404) и в описании канала.

## Постер робота

Постер — это кадр той же 3D-сцены. Чтобы обновить его после изменения модели:

1. `npm run dev` и откройте http://localhost:5173/ru/ в Chrome.
2. Дождитесь появления 3D, наведите курсор так, чтобы голова смотрела на заголовок.
3. В консоли браузера: `await __bayhanCapturePoster()` — dev-сервер сохранит `public/robot/poster.webp` (1200×1200). Хелпер существует только в dev-режиме.

## Структура

```
config/site.ts            base path и origin из окружения
scripts/                  пререндер, проверка сборки, проверка контраста
src/app/                  маршруты, пути, head-теги, контекст страницы
src/content/              тексты на трёх языках, услуги, реальные контакты
src/i18n/                 языки и тип словаря
src/components/           общие компоненты (шапка, футер, кнопки, визуалы услуг)
src/sections/             секции страниц (Hero, Manifesto, Services, Process, Why, CTA)
src/pages/                страницы
src/features/robot/       3D-сцена, проверка возможностей устройства, постер
src/features/brief-form/  форма брифа и формирование сообщения
src/motion/               GSAP, токены движения, хуки появления и магнитных CTA
src/static/               страницы без гидрации (выбор языка, 404)
src/styles/               дизайн-токены, шрифты, базовые стили
```

## Как добавить текст, страницу или услугу

- **Текст:** поле в `src/i18n/types.ts`, затем во всех трёх `src/content/{ru,en,uz}.ts`. Пропущенный перевод — ошибка `npm run typecheck`.
- **Страница:** компонент в `src/pages/`, id в `src/app/routeIds.ts`, запись в `src/app/routes.ts`.
- **Услуга:** id в `src/content/services.ts`, тексты в трёх словарях, мотив в `src/components/ServiceVisual.tsx` — страница, пункт списка и мета-теги появятся автоматически.

## Шрифты и лицензии

Unbounded и Manrope (SIL OFL 1.1) раздаются с сайта (`@fontsource-variable`). У Manrope нет глифа `ʻ` (U+02BB) для узбекских oʻ/gʻ, поэтому этот символ берётся из Unbounded (см. `src/styles/fonts.css`). GSAP распространяется по бесплатной Standard License. Платных ресурсов нет.
