# Доставка приватных релизов Tanuki через GitHub Actions и SSH

Этот сценарий нужен для приватного репозитория `Gabageba/tanuki`: файлы релиза скачивает GitHub Actions с `GITHUB_TOKEN`, а на VPS передаются только проверенные файлы. Токен GitHub на VPS **не требуется**. Docker-образы должны быть доступны из GHCR (текущий workflow Release проверяет анонимную загрузку).

## Схема

- `.github/workflows/release.yml` после успешных CI, сборок и native smoke **автоматически публикует** релиз (без Draft). Если проверки упали, релиз не создаётся.
- `.github/workflows/deploy.yml` запускается вручную (`workflow_dispatch`) или как reusable workflow, вызываемый **в рамках того же** Release workflow после публикации. Отдельное событие `release.published` не используется: публикация через `GITHUB_TOKEN` не запускает новый workflow.
- Workflow скачивает `docker-compose.yml`, `release.env`, `SHA256SUMS`, `tanuki` из приватного GitHub Release и сверяет SHA256.
- Workflow передаёт их по SSH в `/opt/tanuki/.releases/<version>/` и отдельно текущую версию `scripts/self-host/tanuki.sh` как `tanuki-deploy`.
- Автоматическая доставка включается только при repository variable `TANUKI_AUTO_DEPLOY=true`. При наличии `/opt/tanuki/.env` и `/opt/tanuki/api.env` выполняется `./tanuki update <version>` со staged-файлами. При отсутствии конфигурации только размещаются файлы, без запуска контейнеров.
- Первый `install` нужно выполнить **один раз интерактивно**: он создаёт секреты на VPS, запрашивает домен и SMTP. Последующие публикации релизов запускают обновление.

**Важно:** workflow не делает rollback после начавшейся миграции БД: команда `tanuki update` сохраняет резервную копию и выводит инструкцию ручного `restore` при ошибке. Не публикуйте релиз, если не готовы принять обновление приложения.

## Подготовка SSH

GitHub Actions нужен отдельный ключ для развёртывания. Его **приватную** часть храните только в GitHub Actions secret. Не отправляйте ключ в чат, коммиты, Obsidian или открытые файлы.

На доверенной локальной машине:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/tanuki-github-deploy -C "tanuki-github-actions"
```

Публичную часть добавьте в `/root/.ssh/authorized_keys` на VPS. Можно сделать это через уже работающее SSH-подключение:

```bash
cat ~/.ssh/tanuki-github-deploy.pub | ssh root@YOUR_VPS_HOST 'umask 077; mkdir -p ~/.ssh; chmod 700 ~/.ssh; cat >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys'
```

Проверьте новый ключ локально:

```bash
ssh -i ~/.ssh/tanuki-github-deploy root@YOUR_VPS_HOST 'id -u'
```

Должно вернуть `0`. Если SSH-порт нестандартный, добавьте `-p PORT`.

**Фиксация SSH host key:** на VPS узнайте fingerprint ключа сервера:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

На локальной машине получите публичный host key:

```bash
ssh-keyscan -t ed25519 -p 22 YOUR_VPS_HOST > /tmp/tanuki-known-hosts
ssh-keygen -lf /tmp/tanuki-known-hosts
```

Сравните fingerprint **с результатом на самом VPS**, а не просто доверяйте `ssh-keyscan`. При другом SSH-порте укажите его вместо `22`.

В `Settings → Secrets and variables → Actions` добавьте Secrets:

| Secret | Значение |
|---|---|
| `DEPLOY_HOST` | Публичный адрес/IP VPS, доступный с GitHub-hosted runners по SSH |
| `DEPLOY_SSH_KEY` | Содержимое **приватного** ключа `~/.ssh/tanuki-github-deploy` |
| `DEPLOY_KNOWN_HOSTS` | Проверенный текст `/tmp/tanuki-known-hosts` |

При нестандартном порте добавьте Repository **variable** `DEPLOY_PORT`, по умолчанию используется `22`.

SSH-доступ `root` обеспечивает полные права на сервер. Ограничивайте доступ к изменению workflow и secrets в репозитории. Если SSH доступен только из VPN или по allowlist, GitHub-hosted runner не подключится: сначала потребуется специально настроить сетевой доступ.

## Первый запуск: `v1.0.0`

1. В GitHub Actions откройте **Deploy release to VPS → Run workflow**, ветка `master`, `version=v1.0.0`, `operation=stage`.
2. После успешного job на VPS проверьте:

```bash
ls -la /opt/tanuki/.releases/v1.0.0
cd /opt/tanuki
install -m 700 .releases/v1.0.0/tanuki-deploy ./tanuki
```

3. **До установки** проверьте, что конфигурация Xray действительно направляет обычный HTTP fallback на порт `8080`, и что Xray не изменён. Если порт 8080 занят — остановитесь. Запуск `--external-proxy` занимает localhost `8080` и `8443`, не занимает `443`.
4. Запустите первый install:

```bash
cd /opt/tanuki
TANUKI_RELEASE_DIR=/opt/tanuki/.releases/v1.0.0 ./tanuki install --external-proxy
```

Программа спросит доменное имя, доверенный адрес прокси и SMTP. Для Xray на хосте доверенный источник, видимый Caddy, часто `172.30.98.1/32`, но **проверяйте** сетевые параметры в `docker network inspect`, не доверяйте всей приватной сети. Домен для приложения должен вести на сервер и соответствовать сертификату Xray. В `.env` будут сгенерированы пароли БД и другие секреты. Не используйте Mailpit в production. Проверку подлинного клиентского IP через Xray fallback нужно провести отдельно.
5. После установки проверьте здоровье приложения, доступность VPN и создайте приглашение администратора:

```bash
cd /opt/tanuki
./tanuki status
./tanuki admin-invite
```

Не передавайте пригласительную ссылку посторонним.

## Последующие обновления

Когда первая установка проверена и VPN работает, добавьте в `Settings → Secrets and variables → Actions → Variables` переменную `TANUKI_AUTO_DEPLOY` со значением `true`. До этого значения job `deploy` в Release пропускается, а пакет можно доставить вручную через `stage`.

После включения переменной **отправка нового тега** запускает CI, сборку образов, native smoke, автоматическую публикацию GitHub Release и вызов `Deploy release to VPS` **в том же workflow**. Это работает без ручной публикации и без повторной сборки существующего `v1.0.0`. При любой ошибке до публикации шаг доставки не выполняется. Для ручного запуска выберите операцию `update` и тег уже опубликованного релиза. `stage` только загружает файлы и **не меняет** запущенный инстанс.

Перед автоматическим обновлением workflow использует существующую безопасную процедуру `tanuki update`: скачивание образов по digest, остановка записи, резервное копирование, миграции и healthcheck. Но успех деплоя зависит также от доступности публичных Docker-образов, конфигурации Xray и SMTP.

Для диагностики:

```bash
cd /opt/tanuki
./tanuki status
docker compose --env-file .env ps
docker compose --env-file .env logs --tail=100 api web migrate
```

**Не выполняйте** `docker compose down -v` на работающем сервере — это удаляет данные PostgreSQL и Valkey.

## Ограничения

- Изменения workflow и скрипта доставки внесены после сборки `v1.0.0`; Docker-образы **не пересобираются**, но скрипт `tanuki-deploy` доставляется из текущей `master`. Не изменяйте эту связь без проверки совместимости.
- Перед первым запуском нужно вручную подтвердить конфигурацию Xray fallback и работающий VPN. Workflow не меняет порт 443 и настройки 3x-ui.
- Отсутствие `.env` или `api.env` при автоматическом событии release приводит лишь к размещению файла; выполняйте первый install самостоятельно.
- Приватный GitHub Release нельзя скачивать анонимным `curl`: это нормально.
