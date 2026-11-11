# 🦝 Tanuki

PWA-читалка манги, манхвы и маньхуа с упором на русскоязычную аудиторию.

Ключевая идея: **на сервере не хранится ни одного тайтла**. Каталог, описания, главы и
страницы берутся напрямую с сайтов-источников через слой парсеров. Сервер работает как
кеширующий прокси и BFF, а не как хранилище контента.

## Стек

| Слой          | Технология                                                       |
| ------------- | ---------------------------------------------------------------- |
| Фронтенд      | React 19 + TypeScript 7 + Vite 8, Mantine 9, PWA (Workbox)       |
| BFF / API     | NestJS 11 на Fastify 5 (TypeScript)                              |
| Парсеры       | `@tanuki/parsers` — 27 RU-источников, в процессе `apps/api`      |
| Хранилища     | Valkey/Redis (кеш), PostgreSQL + Drizzle (аккаунты и данные)     |
| Монорепо      | pnpm workspaces + Turborepo                                      |
| Качество кода | ESLint 10 · Stylelint 17 · Prettier 3 · husky 9 · lint-staged 17 |

## Документация

| Документ                                           | О чём                                                     |
| -------------------------------------------------- | --------------------------------------------------------- |
| [01 — Архитектура](docs/01-architecture.md)        | Общая схема, границы сервисов, потоки данных              |
| [02 — Технологический стек](docs/02-tech-stack.md) | Зафиксированные версии и обоснование выбора               |
| [03 — Слой парсеров](docs/03-parsers.md)           | `packages/parsers`, RU-источники, миграция с JVM-сайдкара |
| [04 — Контракт API](docs/04-api-contract.md)       | Доменная модель и REST-эндпоинты                          |
| [05 — Фронтенд](docs/05-frontend.md)               | Структура приложения, читалка, состояние                  |
| [06 — PWA и офлайн](docs/06-pwa-offline.md)        | Service worker, стратегии кеширования, скачивание глав    |
| [07 — Тулинг и конвенции](docs/07-tooling.md)      | Готовые конфиги ESLint / Stylelint / Prettier / husky     |
| [08 — Roadmap](docs/08-roadmap.md)                 | Фазы, задачи, оценки, критерии готовности                 |
| [09 — Правовые аспекты](docs/09-legal.md)          | Лицензии, GPL-обязательства, модель распространения       |
| [10 — Хардкод в шапке](docs/10-header-gaps.md)     | Чего не хватает макету шапки и «Источников»               |
| [11 — Решения по макетам](docs/11-ui-decisions.md) | Выбранные варианты UI из песочницы и почему               |
| [12 — TODO](docs/12-todo.md)                       | Что осталось сделать и от чего отказались                 |

## Self-host

Поставка рассчитана на один API и небольшой личный/семейный инстанс. Linux, Docker Engine
24+ и Compose 2.30+ (нужен `env_file.format: raw`), `bash`, `curl`, `openssl`, GNU coreutils,
`tar`, `iproute2` (`ss`) и `getent`. Node.js и pnpm на сервере не нужны. Поддерживаемые образы:
`linux/amd64`, `linux/arm64`. Размер сервера и запас диска зависят от библиотеки, базы и образов;
перед обновлением скрипт проверяет место, а перед backup дополнительно резервирует тройной
размер БД. Следите также за свободным местом Docker data-root, если он на отдельном диске.

Готовые релизы публикуются в [GitHub Releases](https://github.com/Gabageba/tanuki/releases).
Первый релиз и публичность GHCR требуют отдельной публикации владельцем репозитория;
наличие workflow в исходниках не означает, что образы уже опубликованы.

### Установка

Направьте A/AAAA домена на сервер. Для встроенного Caddy откройте входящие TCP 80/443;
проверка локальных портов не доказывает доступность сервера извне. Нужны внешний SMTP с
авторизацией и адрес отправителя. Скрипт проверяет соединение/авторизацию, не отправляя письмо.

Скачайте `tanuki` **из выбранного релиза**, сверив его SHA256 с `SHA256SUMS` того же релиза,
поместите в отдельную папку и выполните:

```bash
chmod 700 tanuki
./tanuki install                 # запрашивает версию, домен и SMTP
./tanuki admin-invite            # ссылка администратора на 7 дней
./tanuki status
```

Перейдите по приглашению, зарегистрируйтесь и подтвердите email. При существующем
администраторе `admin-invite` откажет. Открытой регистрации нет. Затем выберите источник,
откройте каталог, тайтл и главу. Авторизация на некоторых источниках нужна отдельно.

Локальная проверка использует HTTP и Mailpit, сохраняя подтверждение email:

```bash
./tanuki install --local         # http://localhost:8080, письма http://localhost:8025
./tanuki admin-invite
```

Пароли SMTP хранятся в закрытом `api.env`, который Compose читает **как данные** (`raw`):
доллары, кавычки, backticks и обратные слеши не выполняются и не интерполируются.
Значения однострочные. `.env` содержит параметры Compose и автоматически сгенерированные
секреты; пароль БД — 64 hex-символа, поэтому он безопасен в DATABASE_URL. Не заменяйте его
произвольной строкой. Не публикуйте `.env`, `api.env`, `data/` и архивы копий.
Повторный `install` ничего не перезаписывает. Ошибка ввода, DNS или проверки портов до
завершения подготовки удаляет только env-файлы текущей попытки: исправьте причину и
повторите `install`. После неудачного первого запуска исправьте
конфигурацию и выполните `./tanuki recover`: он повторит SMTP-проверку, миграции и запуск
выбранного релиза с прежними секретами и данными. После успешной проверки готовности журнал
снимается и можно создать приглашение администратора. Не удаляйте существующие volumes.

Web Push включается отдельно: `./tanuki push-keys` запрашивает `mailto:`/HTTPS-контакт и
сохраняет новую VAPID-пару. Существующие ключи не заменяются. Без ключей SSE и лента работают.
Сервисные LibSocial-токены хранятся в `data/libsocial-tokens/` (UID 1000); браузерный login-helper
запускайте на своей машине и переносите JSON в этот каталог. Playwright в runtime API нет.

### Внешний HTTPS-прокси

`./tanuki install --external-proxy` оставляет Caddy на `127.0.0.1:8080`; `APP_URL` — внешний
HTTPS-адрес, `COOKIE_SECURE=true`. Введите точный IP/CIDR доверенного прокси, видимый Caddy
(для прокси на хосте обычно gateway сети Compose, `172.30.98.1/32`; проверьте `docker network
inspect`). Не указывайте все приватные сети. API доверяет только фиксированному адресу Caddy;
поддельный клиентский X-Forwarded-For не должен влиять на rate limit. Не публикуйте API отдельно.
Пример nginx на том же сервере (TLS настраивает владелец):

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto https;
    proxy_buffering off;
    proxy_read_timeout 1h;
    client_max_body_size 64m;
    add_header X-Robots-Tag noindex always;
}
```

SSE идёт без буферизации, API и web имеют один origin. Подстройте лимит тела под
`BACKUP_MAX_BYTES` при изменении контракта; nginx не должен уменьшать лимиты аватаров/backup.

### Обновление и резервная копия инстанса

```bash
./tanuki backup
./tanuki update v1.2.3           # только выбранная версия, без автоматического расписания
./tanuki restore /path/to/backups/20261111T000000Z-example.tar
```

Обновление скачивает bundle и образы по digest до простоя, останавливает API/фон и web,
делает согласованный dump, сохраняет `.env`, `api.env`, Compose, версию скрипта, токены
LibSocial и `/data` Caddy (сертификаты). Архив и его содержимое проверяются по SHA256;
незавершённый `.partial` не является копией. Кеш Valkey восстанавливается запросами.
Скачанные главы и несинхронизированный прогресс браузера в серверную копию не входят.
Это другая операция, чем пользовательский экспорт библиотеки.

После начала миграций старый API автоматически не запускается: при сбое выполните точную
команду `restore`, напечатанную скриптом. Восстановление требует ввода `ВОССТАНОВИТЬ`, уничтожает
данные после снимка и восстанавливает согласованные БД, конфигурацию, ключи и версию образов.
При сбое backup до миграций скрипт запускает прежнее приложение и снимает журнал только
после проверки готовности. Если восстановить работу не удалось или процесс прервался,
сохранится `operation.state`: устраните причину и выполните `./tanuki recover`. Эта команда
не продолжает обновление после начала миграций — для него остаётся только `restore`.
Блокировка `.admin-lock` запрещает параллельные
изменения; после аварии сначала проверьте процессы/журнал, затем удалите только эту блокировку.
Старые копии не удаляются автоматически. Переносите их как секреты, вне сервера тоже.
При переносе на другой домен серверные данные сохраняются, а браузерные загрузки и SW остаются
привязаны к старому origin.

### Ручной Compose и сборка из исходников

```bash
cp .env.example .env
: > api.env
# Заполните .env: случайные POSTGRES_PASSWORD/IMG_SIGN_SECRET/METRICS_TOKEN (openssl rand -hex 32),
# SOURCE_SECRETS_KEY (openssl rand -base64 32), APP_URL и режим Caddy/SMTP.
# SMTP_PASSWORD и прочие произвольные однострочные значения записывайте в api.env.
docker build -t tanuki-api:local -f apps/api/Dockerfile .
docker build -t tanuki-web:local -f apps/web/Dockerfile .
mkdir -p data/libsocial-tokens
sudo chown 1000:1000 data/libsocial-tokens
chmod 700 data/libsocial-tokens
chmod 600 .env api.env
cp scripts/self-host/tanuki.sh tanuki
chmod 700 tanuki
docker compose up -d --wait
```

Для готового релиза перенесите `API_IMAGE`, `WEB_IMAGE`, `TANUKI_VERSION`, `CONFIG_SCHEMA` из `release.env` в
`.env`, не используйте `latest`. При каждом обновлении вручную: остановите web/API, сделайте
копию, удалите завершённый контейнер `docker compose rm -sf migrate`, примените миграции
целевого образа, затем запускайте API/web. Не выполняйте `down -v` на рабочем инстансе.
Пара API/web должна быть одного релиза. Образы содержат OCI-ссылку на исходники и лицензию;
исходный код доступен по соответствующему тегу репозитория (GPL-3.0-only).

### Наблюдаемость и диагностика

Liveness: `/api/v1/health`; readiness: `/api/v1/health/ready` (503 при недоступной БД/Valkey,
дедлайн 2 секунды, без обращения к источникам и раскрытия ошибок). Смотрите `docker compose
ps`, `docker compose logs migrate`, `docker compose logs api`, `docker compose logs web`.
Ошибка сертификата — проверяйте A/AAAA, внешний доступ 80/443 и ACME в logs web; ошибка SMTP —
настройки в `api.env` и доступность почтового сервера. Недоступный registry/недостаток места
нужно устранить до переключения версии. Логи действующего API могут содержать личные данные;
не публикуйте их целиком.

Sentry необязателен: `SENTRY_API_DSN` в `api.env`, `SENTRY_WEB_DSN` в `.env`, затем пересоздайте
контейнеры. Без DSN SDK не включается. Web получает только DSN и версию через `/runtime-config.js`
с `no-store`, файл исключён из SW-кеша. Перед отправкой событие пересобирается по allowlist:
технический стек без исходных строк, release, слой, для ошибок парсера — источник/операция/контекст.
Сообщения исключений, URL, пользователь, cookie, запросы, extras и breadcrumbs удаляются.
Replay, tracing, profiling и отправка логов выключены. Ошибки парсеров отправляются до fallback,
HTTP-фильтр повторно их не отправляет. Обычный offline/отказ источника не является Sentry-событием.

`sourcemaps.tar.gz` из релиза хранится отдельно от публичной статики. Для своего Sentry
распакуйте архив и загрузите артефакты через `sentry-cli sourcemaps upload --release <version>`:
web с `--url-prefix '~/assets'`, API с `--url-prefix 'dist'`. Токен загрузки используйте только
на своей машине/в закрытом CI, никогда в `.env` web или общедоступном bundle.

Prometheus подключайте к внутренней сети Compose (`api:9464`) и передавайте bearer из
`METRICS_TOKEN`. Порт 9464 не публикуется, публичный `/metrics` всегда 404; без токена сервер
метрик выключен. Пример внешнего Prometheus, подключённого к этой сети:

```yaml
scrape_configs:
  - job_name: tanuki
    metrics_path: /metrics
    authorization:
      credentials_file: /run/secrets/tanuki_metrics_token
    static_configs:
      - targets: ['api:9464']
```

```promql
sum by (source_id) (increase(tanuki_parser_failures_total[1h]))
sum by (source_id, operation, context) (rate(tanuki_parser_failures_total[5m]))
```

Счётчик считает один упавший вызов метода, включая fallback/background/probe, только после
классификации в `parserFailed`. Cache hit, breaker/очередь до вызова, 404 и сетевой отказ
не увеличивают его. Счётчики процесса сбрасываются при рестарте, историю хранит Prometheus.
Sentry/Prometheus/Grafana не входят в обязательную поставку.

`robots.txt` запрещает обход, HTML и HTTP-заголовки содержат `noindex`; это не заменяет
авторизацию и не обещает удаления уже известных поисковику URL: при Disallow робот может
не увидеть noindex.

## Разработка

```bash
pnpm install
docker compose -f docker-compose.dev.yml up -d # valkey, postgres, mailpit
pnpm db:migrate               # схема БД
pnpm dev                      # turbo запускает web + api параллельно
```

Для просмотра прототипов достаточно фронтенда, без Docker, API и входа:

```bash
pnpm dev:playground           # собирает contracts и открывает /playground в браузере
```

Песочница доступна по `http://localhost:5173/playground` только в dev-режиме; страницы и её
отдельный каркас не включаются в production-сборку.

Web Push включается парой VAPID-ключей в `apps/api/.env` (`npx web-push generate-vapid-keys`, см.
`.env.example`); без них лента уведомлений работает, а push скрыт.

Миграции применяются явной командой, а не при старте приложения.

Если порты заняты другим проектом, задайте в корневом `.env`
свободные `POSTGRES_PORT` и `VALKEY_PORT` (например, `5433` и `6380`). В `apps/api/.env`
укажите эти же порты в `DATABASE_URL` и `REDIS_URL` (см. `apps/api/.env.example`).
Если занят и порт API `3000`, измените `PORT` в `apps/api/.env` и задайте адрес API
в `API_PROXY_TARGET` файла `apps/web/.env` (см. `apps/web/.env.example`). Затем запустите
`pnpm start`; уже работающие dev-серверы после изменения `.env` нужно перезапустить.

## Проверки self-host

`pnpm test:e2e` собирает production и отдельный тестовый API, создаёт временные Compose-проекты
и проверяет production smoke/backup/restore и Chromium desktop/mobile. Нужен Docker; Chromium запускается в согласованном Playwright-образе, в закрытой Docker-сети без внешнего egress. Рабочие `.env` и
volumes не используются. Только временные проекты теста удаляются вместе с volumes.
Fixture-server обслуживает HTML поддерживаемого движка AComics; браузер не подменяет API через
MSW. Ошибки парсеров, очистка телеметрии и timeout readiness дополнительно проверяются unit-тестами.
CI запускает E2E на каждом PR и master; trace, отчёт и логи при сбое хранятся 14 дней.
Release workflow проверяет приложение, строит GHCR multiarch, выполняет native smoke amd64/arm64
и создаёт draft релиза с digest, CLI и SHA256. Пакеты GHCR должны быть публичными: native-smoke
намеренно делает pull без login. Публикацию draft выполняет владелец отдельно.
