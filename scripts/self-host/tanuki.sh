#!/usr/bin/env bash
# Administrative CLI for a single Tanuki instance. No source/eval of configuration.
set -Eeuo pipefail
umask 077
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
cd "$ROOT"
REPOSITORY=Gabageba/tanuki
SCHEMA=1
STAGE=проверка
STOPPED=0
MIGRATING=0
BACKUP_PATH=
WORK=
LOCKED=0
OPERATION=
CONFIGURING=0

fail() { printf 'Ошибка (%s): %s\n' "$STAGE" "$*" >&2; exit 1; }
get() { sed -n "s/^$1=//p" "${2:-.env}" | tail -1; }
# Only values controlled by this script go into Compose's interpolation file.
put() {
  local key=$1 value=$2 file=${3:-.env} temp
  [[ $key =~ ^[A-Z][A-Z0-9_]*$ && $value != *$'\n'* && $value != *$'\r'* ]] || fail 'Недопустимая строка конфигурации.'
  touch "$file"
  temp=$(mktemp "$ROOT/.env-write.XXXXXX")
  awk -v key="$key" 'index($0,key"=")!=1' "$file" > "$temp"
  printf '%s=%s\n' "$key" "$value" >> "$temp"
  mv "$temp" "$file"
}
compose() { docker compose --project-directory "$ROOT" --env-file "$ROOT/.env" -f "$ROOT/docker-compose.yml" "$@"; }
finish() {
  local code=$?
  trap - EXIT INT TERM
  if (( code != 0 )); then
    if (( CONFIGURING == 1 )); then
      # install verified these files did not exist. Discard only this attempt's
      # unpublished configuration so prompts, DNS and port checks can be retried.
      rm -f .env api.env
      printf 'Подготовка не завершена. Исправьте причину и повторите install.\n' >&2
    fi
    if (( STOPPED == 1 && MIGRATING == 0 )); then
      # Configuration and schema are unchanged before migration. Clear our journal only
      # after the previous application is serving requests again.
      if compose start api web >/dev/null 2>&1 && check_ready >/dev/null 2>&1; then
        rm -f operation.state
      fi
    fi
    printf 'Операция остановлена на этапе: %s.\n' "$STAGE" >&2
    if [[ $OPERATION == install && -f operation.state ]]; then
      printf 'После исправления конфигурации продолжите установку: %s/tanuki recover\n' "$ROOT" >&2
    elif (( MIGRATING == 1 )); then
      printf 'Старый API автоматически не запущен. Восстановление: %s/tanuki restore %s\n' "$ROOT" "$BACKUP_PATH" >&2
    fi
  fi
  [[ -z $WORK ]] || rm -rf -- "$WORK"
  (( LOCKED == 0 )) || rmdir "$ROOT/.admin-lock" 2>/dev/null || true
  exit "$code"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

lock() {
  mkdir "$ROOT/.admin-lock" 2>/dev/null || fail 'Другая административная операция уже выполняется. После аварии проверьте operation.state и удалите .admin-lock вручную.'
  LOCKED=1
}
state() { STAGE=$1; printf 'operation=%s\nstage=%s\nbackup=%s\nmigration_started=%s\napi_stopped=%s\nversion=%s\n' "$OPERATION" "$STAGE" "$BACKUP_PATH" "$MIGRATING" "$STOPPED" "$(get TANUKI_VERSION)" > operation.state; }
requirements() {
  local command arch version
  for command in docker curl openssl tar sha256sum awk df sort; do
    command -v "$command" >/dev/null || fail "Установите $command."
  done
  docker info >/dev/null 2>&1 || fail 'Запустите Docker и предоставьте текущему пользователю доступ.'
  version=$(docker version --format '{{.Server.Version}}')
  [[ $(printf '%s\n' 24.0.0 "$version" | sort -V | head -1) == 24.0.0 ]] || fail 'Нужен Docker Engine >=24.'
  version=$(docker compose version --short | tr -d v)
  [[ $(printf '%s\n' 2.30.0 "$version" | sort -V | head -1) == 2.30.0 ]] || fail 'Нужен Docker Compose >=2.30 (env_file format: raw).'
  arch=$(docker info --format '{{.Architecture}}')
  [[ $arch == x86_64 || $arch == aarch64 || $arch == arm64 ]] || fail "Архитектура $arch не поддерживается."
}
installed() { [[ -f .env && -f api.env && -f docker-compose.yml ]] || fail 'Сначала выполните install.'; }
space() {
  local needed=$1 available
  available=$(df -Pk "$ROOT" | awk 'NR==2 {print $4}')
  (( available > needed )) || fail "Нужно свободное место: более $needed КиБ; доступно $available КиБ."
}
version_valid() { [[ $1 =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]] || fail 'Версия должна иметь вид v1.2.3.'; }
fetch_release() {
  local version=$1 target=$2 file
  version_valid "$version"
  mkdir -p "$target"
  for file in docker-compose.yml release.env SHA256SUMS tanuki; do
    curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
      "https://github.com/$REPOSITORY/releases/download/$version/$file" -o "$target/$file" || fail "Не удалось скачать $file релиза $version."
  done
  # Verify required payloads even though the complete manifest also covers docs/maps.
  awk '$2=="docker-compose.yml" || $2=="release.env" || $2=="tanuki"' "$target/SHA256SUMS" > "$target/required.sha256"
  [[ $(wc -l < "$target/required.sha256") -eq 3 ]] || fail 'Нет контрольных сумм обязательных файлов.'
  (cd "$target" && sha256sum --check --status required.sha256) || fail 'Контрольные суммы релиза не совпадают.'
  [[ $(get CONFIG_SCHEMA "$target/release.env") == "$SCHEMA" ]] || fail 'Версия конфигурации несовместима. Нужен новый скрипт и инструкция релиза.'
  [[ $(get TANUKI_VERSION "$target/release.env") == "$version" ]] || fail 'Версия bundle не совпадает.'
  for file in API_IMAGE WEB_IMAGE; do
    [[ $(get "$file" "$target/release.env") =~ ^ghcr\.io/[a-z0-9/_-]+@sha256:[a-f0-9]{64}$ ]] || fail "Нет immutable digest для $file."
  done
  space 2097152
  docker pull "$(get API_IMAGE "$target/release.env")" >/dev/null || fail 'Не удалось получить API из registry.'
  docker pull "$(get WEB_IMAGE "$target/release.env")" >/dev/null || fail 'Не удалось получить web из registry.'
}
apply_release() {
  local target=$1 key
  cp "$target/docker-compose.yml" docker-compose.yml
  for key in API_IMAGE WEB_IMAGE TANUKI_VERSION CONFIG_SCHEMA; do put "$key" "$(get "$key" "$target/release.env")"; done
  cp "$target/release.env" release.env
  # Keep the CLI version paired with its configuration on success.
}
start() {
  compose up -d --wait postgres valkey
  # Never reuse a completed migrator from a previous deployment.
  compose rm -sf migrate >/dev/null
  compose up -d migrate
  local id code
  id=$(compose ps -aq migrate)
  code=$(docker wait "$id")
  [[ $code == 0 ]] || fail 'Миграция не выполнена. Смотрите docker compose logs migrate.'
  compose up -d --wait --wait-timeout 180 api web
  STAGE='проверка приложения'
  check_ready || fail 'Приложение недоступно. Для HTTPS проверьте DNS, внешний доступ 80/443 и logs web (ACME).'
}
check_ready() {
  curl --fail --silent --show-error --retry 12 --retry-delay 5 --retry-all-errors --max-time 10 \
    "$(get APP_URL)/api/v1/health/ready" >/dev/null
}
backup_stopped() {
  local dest dump_size token_size
  state резервирование
  mkdir -p backups
  dump_size=$(compose exec -T postgres psql -U tanuki -d tanuki -Atc 'SELECT pg_database_size(current_database())')
  token_size=$(du -sk data/libsocial-tokens 2>/dev/null | awk '{print $1}') || token_size=0
  space $((dump_size * 3 / 1024 + token_size * 3 + 262144))
  WORK=$(mktemp -d "$ROOT/.backup.XXXXXX")
  mkdir "$WORK/config"
  cp .env api.env docker-compose.yml "$WORK/config/"
  [[ ! -f release.env ]] || cp release.env "$WORK/config/"
  cp "${BASH_SOURCE[0]}" "$WORK/config/tanuki"
  compose exec -T postgres pg_dump -U tanuki -d tanuki -Fc > "$WORK/database.dump"
  compose exec -T postgres pg_restore --list < "$WORK/database.dump" >/dev/null
  # Read tokens/certificates using the existing unprivileged containers; no host UID assumptions.
  compose run --rm --no-deps -T --entrypoint tar api -C /data/libsocial-tokens -cf - . > "$WORK/tokens.tar"
  compose run --rm --no-deps -T --entrypoint tar web -C /data -cf - . > "$WORK/caddy.tar"
  printf 'BACKUP_SCHEMA=1\nTANUKI_VERSION=%s\nCREATED_AT=%s\n' "$(get TANUKI_VERSION)" "$(date -u +%FT%TZ)" > "$WORK/manifest"
  (cd "$WORK" && sha256sum database.dump tokens.tar caddy.tar manifest config/.env config/* > SHA256SUMS)
  dest="$ROOT/backups/$(date -u +%Y%m%dT%H%M%SZ)-$(openssl rand -hex 4).tar"
  tar -C "$WORK" -cf "$dest.partial" config database.dump tokens.tar caddy.tar manifest SHA256SUMS
  tar -tf "$dest.partial" >/dev/null
  mv "$dest.partial" "$dest"
  BACKUP_PATH=$dest
  rm -rf "$WORK"; WORK=
  state 'резервная копия готова'
}
ask() {
  local prompt=$1 key=$2 file=${3:-.env} secret=${4:-false} value
  if [[ $secret == true ]]; then read -r -s -p "$prompt: " value; printf '\n'; else read -r -p "$prompt: " value; fi
  [[ -n $value ]] || fail "Не заполнено: $key."
  # api.env is read in raw mode: $, quotes, backticks and backslashes remain literal data.
  [[ $file == api.env || $value =~ ^[a-zA-Z0-9_./:@,+-]+$ ]] || fail "Недопустимые символы в $key."
  put "$key" "$value" "$file"
}
ports() {
  local port
  command -v ss >/dev/null || fail 'Установите iproute2 (ss) для проверки занятых портов.'
  for port in "$(get HTTP_PORT)" "$(get HTTPS_PORT)"; do
    [[ $port =~ ^[0-9]+$ && $port -gt 0 && $port -lt 65536 ]] || fail 'Порт должен быть 1–65535.'
    [[ -z $(ss -H -ltn "sport = :$port") ]] || fail "Порт $port занят."
  done
}
install() {
  [[ ! -e .env && ! -e api.env && ! -e docker-compose.yml ]] || fail 'Найдена конфигурация. Повторный install её не изменяет; используйте status/update.'
  local mode=${1:-} version=${TANUKI_RELEASE:-} domain
  [[ -n $version ]] || read -r -p 'Версия релиза (v1.2.3): ' version
  WORK=$(mktemp -d "$ROOT/.release.XXXXXX")
  fetch_release "$version" "$WORK"
  CONFIGURING=1
  # Compose interpolation uses only validated safe values. SMTP lives separately in api.env.
  put COMPOSE_PROJECT_NAME tanuki
  put CONFIG_SCHEMA "$SCHEMA"
  put POSTGRES_PASSWORD "$(openssl rand -hex 32)"
  put IMG_SIGN_SECRET "$(openssl rand -hex 32)"
  put SOURCE_SECRETS_KEY "$(openssl rand -base64 32)"
  put METRICS_TOKEN "$(openssl rand -hex 32)"
  put HTTPS_PORT 443
  put HTTP_PORT 80
  put COOKIE_SECURE true
  put CADDY_TRUSTED_PROXIES 127.0.0.1/32
  put TANUKI_SUBNET_PREFIX 172.30.98
  touch api.env
  case "$mode" in
    --local)
      put APP_URL http://localhost:8080; put CADDY_SITE :8080; put WEB_BIND 127.0.0.1
      put HTTP_PORT 8080; put HTTPS_PORT 8443; put COOKIE_SECURE false; put COMPOSE_PROFILES local
      put SMTP_HOST mailpit api.env; put SMTP_PORT 1025 api.env; put SMTP_SECURE false api.env
      put MAIL_FROM 'Tanuki <noreply@localhost>' api.env
      ;;
    ''|--external-proxy)
      ask 'Домен (например manga.example.org)' CADDY_SITE
      domain=$(get CADDY_SITE)
      [[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ && $domain == *.* ]] || fail 'Укажите DNS-имя без схемы и порта.'
      command -v getent >/dev/null || fail 'Нужен getent для проверки DNS.'
      getent ahosts "$domain" >/dev/null || fail 'Домен не разрешается DNS; настройте A/AAAA.'
      put APP_URL "https://$domain"
      if [[ $mode == --external-proxy ]]; then
        put CADDY_SITE :8080; put WEB_BIND 127.0.0.1; put HTTP_PORT 8080; put HTTPS_PORT 8443
        ask 'Точный IP/CIDR внешнего прокси (Docker gateway для прокси на хосте)' CADDY_TRUSTED_PROXIES
      fi
      ask 'SMTP host' SMTP_HOST api.env
      ask 'SMTP port' SMTP_PORT api.env
      ask 'SMTP TLS сразу (true для 465, false для STARTTLS)' SMTP_SECURE api.env
      ask 'SMTP user' SMTP_USER api.env
      ask 'SMTP password' SMTP_PASSWORD api.env true
      ask 'Отправитель (например Tanuki <noreply@example.org>)' MAIL_FROM api.env
      ;;
    *) fail 'Используйте install [--local|--external-proxy].' ;;
  esac
  ports
  space 2097152
  CONFIGURING=0
  apply_release "$WORK"
  state 'подготовка установки'
  # Atomic replacement also pairs a resumed installation with the selected release's CLI.
  chmod 700 "$WORK/tanuki"
  mv "$WORK/tanuki" tanuki
  complete_install
}
complete_install() {
  state 'проверка SMTP'
  compose pull --quiet
  compose up -d --wait postgres valkey
  [[ ,$(get COMPOSE_PROFILES), != *,local,* ]] || compose up -d mailpit
  compose run --rm --no-deps -T api node dist-cli/scripts/preflight.js
  mkdir -p data/libsocial-tokens
  # bind mount must be writable by the image's node UID; no root API runtime.
  docker run --rm --user 0 --entrypoint sh -v "$ROOT/data/libsocial-tokens:/tokens" "$(get API_IMAGE)" -c 'chown 1000:1000 /tokens; chmod 700 /tokens'
  MIGRATING=1; state 'миграции и запуск'
  start
  MIGRATING=0
  rm -f operation.state
  printf 'Инстанс установлен: %s\nПервый администратор: ./tanuki admin-invite\n' "$(get APP_URL)"
  [[ ,$(get COMPOSE_PROFILES), != *,local,* ]] || printf 'Письма Mailpit: http://localhost:%s\n' "${MAILPIT_PORT:-8025}"
}
update() {
  installed
  local version=${1:-}
  if [[ -z $version ]]; then
    local latest
    latest=$(curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 --output /dev/null --write-out '%{url_effective}' "https://github.com/$REPOSITORY/releases/latest") || fail 'Не удалось узнать доступный релиз; укажите версию явно.'
    printf 'Последний доступный релиз: %s\n' "${latest##*/}"
    read -r -p 'Выберите версию (v1.2.3): ' version
  fi
  WORK=$(mktemp -d "$ROOT/.release.XXXXXX")
  fetch_release "$version" "$WORK"
  space 2097152
  [[ $(get CONFIG_SCHEMA) == "$SCHEMA" ]] || fail 'Сначала обновите конфигурацию по инструкции релиза.'
  local target=$WORK
  # Keep downloaded release outside backup's temporary workspace.
  WORK=
  state 'остановка записи'; STOPPED=1
  compose stop web api
  backup_stopped
  WORK=$target
  MIGRATING=1
  state 'переключение релиза'
  apply_release "$target"
  state миграции
  start
  cp "$target/tanuki" tanuki; chmod 700 tanuki
  STOPPED=0; MIGRATING=0
  rm -f operation.state
  printf 'Обновлено до %s. Готовность проверена. Резервная копия: %s\n' "$version" "$BACKUP_PATH"
}
recover() {
  installed
  [[ -f operation.state ]] || fail 'Нет незавершённой операции.'
  OPERATION=$(get operation operation.state)
  if [[ $OPERATION == install ]]; then
    # Retry only the selected installation: secrets, configuration and existing data stay in place.
    complete_install
    return
  fi
  [[ $(get migration_started operation.state) == 0 ]] || fail 'Миграции уже начались. Используйте restore с копией из operation.state.'
  case "$OPERATION" in
    backup|update)
      STOPPED=1
      compose start api web
      check_ready || fail 'Приложение ещё не готово. Исправьте причину и повторите recover.'
      STOPPED=0
      rm -f operation.state
      printf 'Работа прежнего инстанса проверена. Административные команды разблокированы.\n'
      ;;
    *) fail 'Операция в журнале не распознана; проверьте его вручную.' ;;
  esac
}

restore() {
  installed
  local backup=${1:?Укажите путь к резервной копии} answer entry
  [[ -f $backup ]] || fail 'Копия не найдена.'
  WORK=$(mktemp -d "$ROOT/.restore.XXXXXX")
  # Reject links, device nodes, absolute paths and traversal before extracting an archive.
  tar -tvf "$backup" | awk 'substr($0,1,1)!="-" && substr($0,1,1)!="d" {exit 1}' || fail 'Недопустимый тип файла в копии.'
  while IFS= read -r entry; do
    case "$entry" in
      config/|config/.env|config/api.env|config/docker-compose.yml|config/release.env|config/tanuki|database.dump|tokens.tar|caddy.tar|manifest|SHA256SUMS) ;;
      *) fail "Неизвестный файл в копии: $entry" ;;
    esac
  done < <(tar -tf "$backup")
  tar -xf "$backup" -C "$WORK" --no-same-owner --no-same-permissions
  local required
  for required in database.dump tokens.tar caddy.tar manifest config/.env config/api.env config/docker-compose.yml config/tanuki; do
    [[ -f $WORK/$required ]] || fail "В копии отсутствует $required."
    awk -v name="$required" '$2==name {found=1} END {exit !found}' "$WORK/SHA256SUMS" || fail "Нет checksum $required."
  done
  (cd "$WORK" && sha256sum --check --status SHA256SUMS) || fail 'Копия повреждена.'
  for required in tokens.tar caddy.tar; do
    tar -tvf "$WORK/$required" | awk 'substr($0,1,1)!="-" && substr($0,1,1)!="d" {exit 1}' || fail 'Копия содержит ссылку или специальный файл.'
    while IFS= read -r entry; do
      [[ $entry != /* && $entry != ../* && $entry != */../* && $entry != */.. ]] || fail 'Небезопасный путь в копии.'
    done < <(tar -tf "$WORK/$required")
  done
  [[ $(get BACKUP_SCHEMA "$WORK/manifest") == 1 ]] || fail 'Формат копии не поддерживается.'
  local image
  for entry in API_IMAGE WEB_IMAGE; do
    image=$(get "$entry" "$WORK/config/.env")
    [[ $image =~ ^[a-zA-Z0-9_./:@-]+$ ]] || fail 'Некорректный образ в копии.'
    docker image inspect "$image" >/dev/null 2>&1 || docker pull "$image" >/dev/null || fail 'Образ копии недоступен.'
  done
  compose exec -T postgres pg_restore --list < "$WORK/database.dump" >/dev/null || fail 'Dump не читается.'
  space "$(du -sk "$WORK" | awk '{print $1*3+262144}')"
  printf 'Восстановить инстанс %s из %s? Данные после снимка будут потеряны.\n' "$(get COMPOSE_PROJECT_NAME)" "$backup"
  read -r -p 'Введите ВОССТАНОВИТЬ: ' answer
  [[ $answer == ВОССТАНОВИТЬ ]] || fail 'Восстановление отменено.'
  BACKUP_PATH=$backup; MIGRATING=1
  state восстановление
  compose stop web api
  compose down --remove-orphans
  cp "$WORK/config/.env" .env; cp "$WORK/config/api.env" api.env
  cp "$WORK/config/docker-compose.yml" docker-compose.yml
  [[ ! -f $WORK/config/release.env ]] || cp "$WORK/config/release.env" release.env
  compose up -d --wait postgres valkey
  compose exec -T postgres psql -U tanuki -d postgres -v ON_ERROR_STOP=1 -c 'DROP DATABASE IF EXISTS tanuki WITH (FORCE)' -c 'CREATE DATABASE tanuki OWNER tanuki'
  compose exec -T postgres pg_restore -U tanuki -d tanuki --exit-on-error --no-owner < "$WORK/database.dump"
  local password
  password=$(get POSTGRES_PASSWORD)
  [[ $password =~ ^[a-f0-9]{64}$ ]] || fail 'Ожидался сгенерированный пароль БД (64 hex).'
  printf "ALTER ROLE tanuki PASSWORD '%s';\n" "$password" | compose exec -T postgres psql -U tanuki -d postgres -v ON_ERROR_STOP=1 >/dev/null
  compose exec -T valkey valkey-cli FLUSHALL >/dev/null
  compose run --rm --no-deps -T --entrypoint sh api -c 'find /data/libsocial-tokens -mindepth 1 -delete; tar -xf - -C /data/libsocial-tokens' < "$WORK/tokens.tar"
  compose run --rm --no-deps -T --entrypoint sh web -c 'find /data -mindepth 1 -delete; tar -xf - -C /data' < "$WORK/caddy.tar"
  start
  cp "$WORK/config/tanuki" tanuki; chmod 700 tanuki
  MIGRATING=0
  rm -f operation.state
  printf 'Инстанс восстановлен. Готовность проверена: %s\n' "$(get APP_URL)"
}

command=${1:-status}; shift || true
OPERATION=$command
requirements
case "$command" in
  install|update|backup|admin-invite|push-keys)
    [[ ! -f operation.state ]] || fail 'Найдена незавершённая операция. Выполните status; для установки или сбоя до миграций используйте recover, после миграций — restore указанной копии.'
    ;;
esac
case "$command" in
  install|update|backup|restore|recover|admin-invite|push-keys) lock ;;
esac
case "$command" in
  install) install "$@" ;;
  update) update "$@" ;;
  backup)
    installed; state 'остановка записи'; STOPPED=1; compose stop web api
    backup_stopped
    compose start api web; STOPPED=0; rm -f operation.state
    printf 'Резервная копия: %s\n' "$BACKUP_PATH"
    ;;
  restore) restore "$@" ;;
  recover) recover ;;
  admin-invite) installed; compose exec -T api node dist-cli/scripts/create-invite.js ;;
  push-keys)
    installed
    [[ -z $(get VAPID_PUBLIC_KEY api.env) && -z $(get VAPID_PRIVATE_KEY api.env) ]] || fail 'VAPID-пара уже существует и не будет заменена.'
    ask 'Контакт владельца (mailto: или https://)' VAPID_SUBJECT api.env
    subject=$(get VAPID_SUBJECT api.env)
    [[ $subject == mailto:*@* || $subject == https://* ]] || fail 'VAPID_SUBJECT должен быть mailto:email или HTTPS-адресом.'
    keys=$(compose exec -T api node dist-cli/scripts/push-keys.js)
    put VAPID_PUBLIC_KEY "$(get VAPID_PUBLIC_KEY <(printf '%s\n' "$keys"))" api.env
    put VAPID_PRIVATE_KEY "$(get VAPID_PRIVATE_KEY <(printf '%s\n' "$keys"))" api.env
    compose up -d --no-deps --wait api
    printf 'Push включён. Ключи сохранены в api.env.\n'
    ;;
  status) installed; compose ps; [[ ! -f operation.state ]] || cat operation.state ;;
  *) fail 'Команды: install, update <version>, backup, restore <backup>, recover, admin-invite, push-keys, status.' ;;
esac
