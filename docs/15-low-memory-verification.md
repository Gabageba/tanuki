# Проверка малопамятного VPS (1–2 ГиБ)

Этот документ — процедура измерения, а не свидетельство прохождения теста.
Проводите первые эксперименты **локально или на отдельном стенде**, не на VPS с рабочим 3x-ui.

## 1. PostgreSQL

Драйвер postgres.js в `apps/api/src/database/database.service.ts` уже имеет `max: 5`.
Не уменьшайте его без измерений.

Для экспериментального сервера можно подключить отдельный override:

```sh
docker compose -f docker-compose.yml -f docker-compose.low-memory.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.low-memory.yml up -d --wait
```

Override меняет только PostgreSQL: `shared_buffers=32MB`, `work_mem=2MB`,
`maintenance_work_mem=32MB`, `max_connections=30`.
Эти значения не прошли production-валидацию и могут замедлить тяжёлые запросы.
Изменение команды перезапустит PostgreSQL; прежде чем применять к рабочей БД,
сделайте резервную копию. **Не используйте `down -v`.**

Проверка настроек:

```sh
docker compose exec -T postgres psql -U tanuki -d tanuki -c \
  "SELECT name, setting, unit FROM pg_settings WHERE name IN ('shared_buffers','work_mem','maintenance_work_mem','max_connections') ORDER BY name;"
docker compose exec -T postgres psql -U tanuki -d tanuki -c \
  "SELECT count(*) AS active_connections FROM pg_stat_activity;"
```

## 2. Память процесса API

Если `METRICS_TOKEN` задан, защищённый внутренний endpoint `9464/metrics`
показывает `tanuki_process_memory_bytes` с метками `rss`, `heap_used`,
`heap_total`, `external`, `array_buffers`. Порт **не публикуйте наружу**.
Собирать значения можно из контейнера, не раскрывая токен в shell:

```sh
docker compose exec -T api node -e '
fetch("http://127.0.0.1:9464/metrics", {
  headers: { Authorization: "Bearer " + process.env.METRICS_TOKEN }
}).then(async r => {
  if (!r.ok) throw Error("metrics HTTP " + r.status);
  for (const line of (await r.text()).split("\n"))
    if (line.startsWith("tanuki_process_memory_bytes")) console.log(line);
}).catch(e => { console.error(e.message); process.exitCode = 1; });
'
```

Для часовой проверки с интервалом 10 секунд (360 точек):

```sh
for i in $(seq 1 360); do
  date -u +'%FT%TZ'
  docker compose exec -T api node -e '
  fetch("http://127.0.0.1:9464/metrics", {
    headers: { Authorization: "Bearer " + process.env.METRICS_TOKEN }
  }).then(async r => {
    if (!r.ok) throw Error("metrics HTTP " + r.status);
    for (const line of (await r.text()).split("\n"))
      if (line.startsWith("tanuki_process_memory_bytes")) console.log(line);
  }).catch(e => { console.error(e.message); process.exitCode = 1; });
  '
  sleep 10
done > memory-samples.txt
```

Параллельно смотрите `docker stats`, `docker events --filter event=oom`,
`docker compose ps` и ошибки в логах. Рост RSS при стабильном heap может
быть связан с буферами/нативными аллокациями, но сам по себе не доказывает утечку.
Фиксируйте пик, тренд после прогрева, HTTP 429/5xx, p95 и перезапуски.

## 3. Существующий изолированный стресс-тест

```sh
docker build -t tanuki-api:local -f apps/api/Dockerfile .
docker build -t tanuki-web:local -f apps/web/Dockerfile .
pnpm --filter @tanuki/api build
LOAD_PROFILES=1 LOAD_SECONDS=60 node tests/load/run.mjs
```

Требуется локальный Docker минимум с четырьмя CPU; контейнеры приложения
ограничиваются одним CPU. Детали и отчёт в `tests/load/README.md`.
Этот тест **отключает** фоновые проверки и не покрывает их пересечение.

## 4. Совместная нагрузка и фоновые задачи

Для настоящего совместного теста нужен **отдельный стенд** с тестовой БД,
реалистичными закладками, контролируемыми источниками и доступными
`SOURCE_PROBE`/`BOOKMARK_UPDATES`. В рабочем API уже существуют ограничения:
`SOURCE_PROBE_CONCURRENCY=3`, `BOOKMARK_UPDATES_CONCURRENCY=2`,
`SOURCE_MAX_CONCURRENCY=4`; они не заменяют измерений.

Для проверки пересечения на стенде:

1. Установите расписания обоих cron на одну минуту в тестовом `api.env`
   (`SOURCE_PROBE_CRON=* * * * *` и `BOOKMARK_UPDATES_CRON=* * * * *`),
   убедитесь, что обе задачи включены. **Не делайте это в production**:
   запросы к внешним источникам могут вызвать блокировки.
2. Наполните тестовую БД отслеживаемыми закладками, иначе обновление будет пустым.
3. Параллельно гоняйте смешанный авторизованный API-трафик и снимайте память
   как в разделе 2. Фиксируйте время обоих cron, HTTP-статусы, p95 и OOM.
4. Восстановите обычное расписание, сравните пики с базовой линией без cron.

Этот совместный сценарий **ещё не автоматизирован**; нельзя приписывать ему
показатели из `tests/load/RESULTS.md`.

## Критерии оценки

Не считать успешным тест, если любой контейнер перезапустился из-за OOM,
сломалась готовность API или значительная доля запросов закончилась 5xx.
Ожидаемые 429 при превышении лимита считать отказанной работой, а не успешными
запросами. Для соседства с 3x-ui на 2 ГиБ отдельно отслеживать память и
задержки Xray: нагрузочный стенд Tanuki сам VPN не моделирует.
