# Установка Tanuki на сервер

Пошаговая установка на чистый VPS с Ubuntu 24.04, собственным доменом и автоматическим
HTTPS. Команды рассчитаны на один личный или семейный инстанс.

По проверке GitHub Releases от 12 ноября 2026 г. опубликованных релизов ещё нет, поэтому
основной путь ниже — сборка из исходников. Node.js и pnpm отдельно устанавливать не нужно:
сборка выполняется внутри Docker. После появления релизов установка готовых образов через
`./tanuki install` описана в [README](../README.md#self-host).

Команды сверены с конфигурацией репозитория. Выполнение на конкретном сервере и получение
сертификата для его домена проверяются при установке.

## 1. Что подготовить

- VPS с Ubuntu 24.04, архитектурой `amd64` или `arm64`, доступом по SSH и правами `sudo`.
- Домен или поддомен, например `manga.example.org`.
- SMTP для отправки писем: сервер, порт, логин, пароль и разрешённый адрес отправителя.
- Доступ сервера к GitHub, Docker Hub, сайтам-источникам и SMTP.

Точные минимальные RAM и CPU проекта пока не измерены. Сборка на сервере требует
дополнительных ресурсов; место понадобится также для Docker-образов, базы и резервных
копий. Проверяйте свободное место как в каталоге приложения, так и на диске Docker,
если они расположены отдельно.

В примерах заменяйте `SERVER_IP`, `YOUR_USER` и `manga.example.org` своими значениями.

## 2. Домен и сетевой доступ

В DNS домена создайте запись:

| Тип | Имя     | Значение     |
| --- | ------- | ------------ |
| A   | `manga` | IPv4 сервера |

Если используете IPv6, добавьте `AAAA`. Если IPv6 на сервере не работает, лишней `AAAA`
быть не должно.

В панели провайдера VPS разрешите входящие соединения:

| Порт                        | Назначение                   |
| --------------------------- | ---------------------------- |
| Ваш SSH-порт, обычно TCP 22 | Управление сервером          |
| TCP 80                      | HTTP и получение сертификата |
| TCP 443                     | HTTPS                        |

PostgreSQL, Valkey и API отдельно открывать не нужно: Compose не публикует их порты.
Разрешите исходящие соединения, необходимые для загрузки образов, HTTPS-запросов
к источникам, DNS и подключения к вашему SMTP.

Если домен обслуживает Cloudflare, для первой установки используйте режим **DNS only**.

## 3. Подключение и установка Docker

Подключитесь к серверу:

```bash
ssh YOUR_USER@SERVER_IP
```

Перейдите в административную оболочку:

```bash
sudo -i
```

**Все следующие серверные команды выполняются в этой оболочке от root.** Команды,
которые нужно выполнять на своём компьютере, отмечены отдельно.

Установите утилиты:

```bash
apt update
apt install -y ca-certificates curl git openssl bash coreutils tar iproute2 nano
```

Добавьте официальный репозиторий Docker:

```bash
install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc

chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release

cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt update

apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

systemctl enable --now docker
```

Это установка через [официальный apt-репозиторий Docker](https://docs.docker.com/engine/install/ubuntu/).
Инструкция рассчитана на чистый сервер. Если на сервере уже установлен Docker из другого
источника, сначала проверьте совместимость пакетов по этой документации.

Проверьте:

```bash
docker version
docker compose version
docker run --rm hello-world
```

Tanuki требует **Docker Engine 24+ и Compose 2.30+**. В Compose нужен режим
`env_file.format: raw`.

Если используете UFW, учтите: опубликованные Docker-порты могут обходить его правила.
Внешний доступ контролируйте также через firewall провайдера.
См. [ограничения firewall в документации Docker](https://docs.docker.com/engine/install/ubuntu/#firewall-limitations).

## 4. Проверка DNS и портов

Проверьте разрешение домена:

```bash
getent ahosts manga.example.org
```

В выводе должен быть IP вашего сервера.

Проверьте, свободны ли порты:

```bash
ss -ltnp 'sport = :80'
ss -ltnp 'sport = :443'
```

На чистом сервере вывод будет пустым. Это проверяет только локальную занятость портов,
а доступность извне зависит также от сети и firewall.

Если порты уже занимает nginx, Apache или другой прокси, схема ниже требует адаптации.
Пример внешнего HTTPS-прокси есть в [README](../README.md#внешний-https-прокси): Caddy
должен слушать только localhost, а `APP_URL` оставаться внешним HTTPS-адресом.
Не запускайте команды для прямой публикации 80/443 поверх существующего прокси.

## 5. Загрузка исходников

Скачайте репозиторий:

```bash
git clone --branch master \
  https://github.com/Gabageba/tanuki.git \
  /opt/tanuki

cd /opt/tanuki
```

Если репозиторий закрытый, предоставьте серверу доступ через read-only deploy key
и вместо HTTPS-команды используйте SSH:

```bash
git clone --branch master \
  git@github.com:Gabageba/tanuki.git \
  /opt/tanuki

cd /opt/tanuki
```

Выполняйте **один** из этих вариантов. Не переносите на сервер личный SSH-ключ
со своего компьютера: для deploy key создайте отдельную пару.

Зафиксируйте идентификатор сборки:

```bash
TANUKI_BUILD="$(git rev-parse --short=12 HEAD)"
```

Следующие команды до завершения сборки выполняйте в той же оболочке, чтобы переменная
сохранилась. Если подключились заново, перейдите в `/opt/tanuki` и задайте её повторно.

## 6. Конфигурация приложения

Укажите домен без `https://`, порта и завершающего слеша:

```bash
TANUKI_DOMAIN=manga.example.org
```

Создайте `.env`:

```bash
umask 077

cat > .env <<EOF
COMPOSE_PROJECT_NAME=tanuki
CONFIG_SCHEMA=1

API_IMAGE=tanuki-api:${TANUKI_BUILD}
WEB_IMAGE=tanuki-web:${TANUKI_BUILD}
TANUKI_VERSION=source-${TANUKI_BUILD}

APP_URL=https://${TANUKI_DOMAIN}
CADDY_SITE=${TANUKI_DOMAIN}
WEB_BIND=0.0.0.0
HTTP_PORT=80
HTTPS_PORT=443
COOKIE_SECURE=true

POSTGRES_PASSWORD=$(openssl rand -hex 32)
IMG_SIGN_SECRET=$(openssl rand -hex 32)
SOURCE_SECRETS_KEY=$(openssl rand -base64 32)
METRICS_TOKEN=$(openssl rand -hex 32)

CADDY_TRUSTED_PROXIES=127.0.0.1/32
TANUKI_SUBNET_PREFIX=172.30.98
EOF
```

**Эту команду выполняйте только при первой установке.** Повторное выполнение заменит
пароли и ключи уже работающего приложения. Если `.env` уже существует, сначала
разберитесь, к какому инстансу он относится.

| Переменная           | Назначение                                          |
| -------------------- | --------------------------------------------------- |
| `APP_URL`            | Адрес приложения в письмах и приглашениях           |
| `CADDY_SITE`         | Домен, для которого Caddy получает HTTPS-сертификат |
| `POSTGRES_PASSWORD`  | Пароль базы                                         |
| `IMG_SIGN_SECRET`    | Подпись ссылок на изображения                       |
| `SOURCE_SECRETS_KEY` | Шифрование привязанных аккаунтов источников         |
| `METRICS_TOKEN`      | Доступ к внутренним метрикам                        |

Сгенерированный пароль PostgreSQL оставьте в hex-формате: он используется внутри
`DATABASE_URL`. `SOURCE_SECRETS_KEY` обязательно сохраняйте в резервной копии:
потеря ключа потребует повторной привязки аккаунтов источников.

Если сеть `172.30.98.0/24` пересекается с существующей сетью сервера или Docker,
выберите свободную `/24` и измените `TANUKI_SUBNET_PREFIX` до первого запуска.

## 7. Настройка почты

Создайте отдельный файл:

```bash
cp deploy/api.env.example api.env
nano api.env
```

Для SMTP на порту 587 заполните:

```dotenv
SMTP_HOST=smtp.example.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.org
SMTP_PASSWORD=ваш_пароль_SMTP
MAIL_FROM=Tanuki <noreply@example.org>

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.org
SENTRY_API_DSN=
```

Для SMTP с непосредственным TLS на порту 465:

```dotenv
SMTP_PORT=465
SMTP_SECURE=true
```

На порту 587 значение `false` означает, что соединение начинается без непосредственного
TLS и может переключиться на STARTTLS. Используйте параметры вашего почтового провайдера.

Значения в `api.env` записывайте **одной строкой, без обрамляющих кавычек и
shell-экранирования**. Compose читает этот файл в режиме `raw`, поэтому `$`, кавычки
и обратные слеши в пароле сохраняются буквально.

Адрес `MAIL_FROM` должен быть разрешён почтовым провайдером. Если провайдер требует
подтверждение домена и DNS-записи SPF/DKIM, завершите эту настройку.

В nano сохраните файл через `Ctrl+O`, `Enter`, затем выйдите через `Ctrl+X`.

Закройте доступ к конфигурации:

```bash
chmod 600 .env api.env
```

## 8. Сборка приложения

Подготовьте каталог служебных токенов:

```bash
mkdir -p data/libsocial-tokens
chown 1000:1000 data/libsocial-tokens
chmod 700 data/libsocial-tokens
```

Соберите API:

```bash
docker build \
  -t "tanuki-api:${TANUKI_BUILD}" \
  -f apps/api/Dockerfile .
```

Соберите фронтенд:

```bash
docker build \
  -t "tanuki-web:${TANUKI_BUILD}" \
  -f apps/web/Dockerfile .
```

Дождитесь успешного завершения обеих сборок. Пока они не завершились, к запуску
не переходите. API и web должны быть собраны из одного состояния исходников.

Проверьте конфигурацию:

```bash
docker compose config --quiet
```

При успехе команда ничего не выведет.

Подготовьте административный CLI:

```bash
cp scripts/self-host/tanuki.sh tanuki
chmod 700 tanuki
```

Здесь **не нужно выполнять `./tanuki install`**: эта команда рассчитана на
опубликованный релиз, а конфигурацию и образы мы подготовили вручную.

## 9. Проверка SMTP и первый запуск

Запустите хранилища:

```bash
docker compose up -d --wait postgres valkey
```

Проверьте соединение и авторизацию SMTP:

```bash
docker compose run --rm --no-deps -T api \
  node dist-cli/scripts/preflight.js
```

Ожидаемое сообщение:

```text
Подключение и авторизация SMTP проверены; письмо не отправлялось.
```

Если проверка завершилась ошибкой, исправьте `api.env` и повторите её.
Проверка подключения не подтверждает доставку письма: это проверяется при регистрации.

Запустите остальные сервисы:

```bash
docker compose up -d --wait --wait-timeout 180
```

Compose автоматически:

1. Дождётся PostgreSQL.
2. Применит миграции.
3. Запустит API после успешных миграций и готовности Valkey для кеша и счётчиков.
4. Запустит web/Caddy после готовности API.

Caddy получит сертификат для указанного домена. Для этого DNS и внешний доступ
к портам 80/443 уже должны работать.

Проверьте контейнеры:

```bash
docker compose ps -a
```

`postgres`, `valkey`, `cache`, `api`, `web` должны работать. Завершившийся `migrate`
со статусом `Exited (0)` — нормальное состояние.

Проверьте приложение через публичный адрес:

```bash
curl -fsS https://manga.example.org/api/v1/health/ready
```

Ожидаемый ответ:

```json
{ "status": "ok" }
```

Повторите эту проверку со своего компьютера — так вы проверите внешний доступ.

Если первый ручной запуск завершился ошибкой, исправьте причину по логам и повторите
команду запуска. Не создавайте заново `.env` и не удаляйте volumes. Команда
`./tanuki recover` предназначена для операций CLI с `operation.state`; ручная установка
по этой инструкции такого журнала не создаёт.

## 10. Первый администратор

На сервере выполните:

```bash
cd /opt/tanuki
./tanuki admin-invite
```

Команда напечатает ссылку вида:

```text
https://manga.example.org/register?invite=...
```

Откройте её в браузере, зарегистрируйтесь и подтвердите email.

Приглашение действует **7 дней**. Храните ссылку как секрет. После появления
администратора команда откажется создавать ещё одного.

Открытой регистрации нет: остальных пользователей приглашает администратор
через приложение.

После входа проверьте полный сценарий:

1. Откройте источник и каталог.
2. Откройте тайтл.
3. Откройте главу и дождитесь изображений.
4. Добавьте тайтл в закладки.
5. Проверьте сохранение прогресса.

Некоторые источники требуют отдельного входа в аккаунт этого источника.
Служебные LibSocial-токены для фоновых задач хранятся в `data/libsocial-tokens/`:
браузерный login-helper запускают на своей машине, затем переносят JSON в этот каталог
с сохранением доступа для UID 1000. Playwright в runtime API отсутствует.

## 11. Web Push — по желанию

Выполните:

```bash
./tanuki push-keys
```

На запрос контакта укажите:

```text
mailto:admin@example.org
```

CLI создаст VAPID-ключи, сохранит их в `api.env` и пересоздаст API. Затем разрешите
уведомления в браузере. Существующую пару ключей команда не заменяет.

Без VAPID-ключей лента уведомлений продолжает работать.

## 12. Первая резервная копия

Выполните:

```bash
./tanuki backup
```

Команда ненадолго остановит приложение, создаст согласованную копию и запустит его
снова. Архив появится в `/opt/tanuki/backups/`; CLI напечатает точный путь.

В копию входят база, конфигурация, секреты, служебные токены источников и сертификаты
Caddy. Скачанные в браузер главы и несинхронизированный браузерный прогресс в неё
не входят. Это резервная копия инстанса, отдельная от пользовательского экспорта
библиотеки.

Храните копию также вне VPS. Архив содержит секреты; не делайте его общедоступным.

Если SSH-вход от root разрешён вашей конфигурацией, скачать архив можно **на своём
компьютере**:

```bash
scp root@SERVER_IP:/opt/tanuki/backups/ИМЯ_АРХИВА.tar .
```

Если вход от root запрещён, используйте свой административный способ скачивания.
Например, в root-оболочке сервера подготовьте закрытую копию для SSH-пользователя,
заменив имя пользователя и путь к его домашнему каталогу:

```bash
install -m 600 -o YOUR_USER -g "$(id -gn YOUR_USER)" \
  /opt/tanuki/backups/ИМЯ_АРХИВА.tar \
  /home/YOUR_USER/tanuki-backup.tar
```

Затем **на своём компьютере**:

```bash
scp YOUR_USER@SERVER_IP:/home/YOUR_USER/tanuki-backup.tar .
```

После успешного скачивания удалите промежуточную копию из домашнего каталога сервера:

```bash
rm /home/YOUR_USER/tanuki-backup.tar
```

Восстановление на существующем инстансе:

```bash
./tanuki restore /opt/tanuki/backups/ИМЯ_АРХИВА.tar
```

Команда потребует ввести `ВОССТАНОВИТЬ`. Данные, появившиеся после снимка, будут
потеряны. Для восстановления нужны образы указанной в копии версии: при локальной
сборке сохраните их в Docker, поскольку CLI не собирает отсутствующие образы заново.

## 13. Обслуживание и диагностика

Состояние:

```bash
cd /opt/tanuki
./tanuki status
```

Последние логи:

```bash
docker compose logs --tail=100 migrate
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

| Проблема                       | Что проверить                                                    |
| ------------------------------ | ---------------------------------------------------------------- |
| Домен не открывается           | A/AAAA, firewall провайдера, порты 80/443                        |
| Ошибка HTTPS                   | DNS, доступ извне, сообщения ACME в логах `web`                  |
| Не запускается API             | Логи `migrate`, затем `api`                                      |
| Не проходит SMTP               | Адрес сервера, порт, TLS, пароль и ограничения провайдера        |
| Письмо не приходит             | Спам, разрешённый `MAIL_FROM`, SPF/DKIM, логи API                |
| Не работает отдельный источник | Его доступность с VPS и необходимость авторизации                |
| Ошибка создания Docker-сети    | Пересечение подсети с существующими сетями                       |
| Сборка прерывается             | Свободные RAM и диск, доступ к registry и реальная ошибка сборки |

После изменения SMTP пересоздайте API:

```bash
docker compose up -d --no-deps --wait api
```

Обычный `restart` не применяет изменённые переменные окружения.

Контейнеры рабочих сервисов используют `restart: unless-stopped`, а Docker включён
в автозапуск. После перезагрузки сервера проверьте `./tanuki status` и readiness.

**Не выполняйте `docker compose down -v` на рабочем сервере:** эта команда удаляет
volumes, включая базу. Не публикуйте `.env`, `api.env`, каталоги `data/`, архивы копий
и полные логи API.

## 14. Обновления

Обновление через `./tanuki update v…` рассчитано на опубликованные релизы. CLI
скачивает выбранные образы, делает согласованную копию и применяет миграции.

Для текущей установки из исходников обновление требует подготовки согласованной
пары API/web и отдельного выполнения миграций. Перед переключением остановите
запись и создайте резервную копию. Не переиспользуйте теги прежних локальных образов:
они нужны для восстановления. Завершённый контейнер `migrate` перед применением
новых миграций необходимо удалить через `docker compose rm -sf migrate`.

После начала миграций откат только образов может быть несовместим с новой схемой БД.
Используйте восстановление согласованной копии, включающей БД, конфигурацию и версию
образов. Подробнее об административных операциях — в [README](../README.md#self-host).

## 15. Перенос действующего инстанса на другой VPS

Эта инструкция дополняет установку на чистом сервере: повторно создавать пользователей,
ключи и базу не требуется. Переносится установленная версия Tanuki, а обновление
выполняется отдельно после проверки нового сервера.

Ниже описана холодная копия Docker volumes. Она подходит при одинаковой архитектуре
процессора, совместимых версиях Docker и PostgreSQL и отсутствии инстанса на новом VPS.
Используйте те же образы, что и на старом сервере. При смене архитектуры или несовместимости
PostgreSQL нужен отдельный план логического восстановления из dump. Команда `tanuki restore`
рассчитана на существующий инстанс, а не на пустой сервер.

Во всех примерах замените `NEW_IP` на адрес нового VPS, `manga.example.org` на свой домен.
Серверные команды выполняются от root. Для SSH предполагается порт 22; для другого порта
добавьте `ssh -p PORT` и `scp -P PORT` соответственно.

### 15.1. Что переносится

- Весь `/opt/tanuki`, включая скрытые файлы `.env`, `api.env`, `.releases/`, резервные
  копии и `data/libsocial-tokens/`.
- `tanuki_postgres-data` — база, аккаунты, закладки, прогресс и настройки.
- `tanuki_valkey-data` — постоянные служебные данные Valkey.
- `tanuki_caddy-data` и `tanuki_caddy-config` — данные Caddy, включая сертификаты.

Имена volumes приведены для `COMPOSE_PROJECT_NAME=tanuki`; если имя проекта отличается,
адаптируйте имена и labels во всех командах. Кеш сервиса `cache` не переносится.
Не нужно копировать весь `/var/lib/docker`. Nginx, внешний TLS, Xray и SSH — отдельная
инфраструктура, которая не входит в каталог приложения.

Архивы содержат конфигурацию, пароли, ключи шифрования и токены. Храните их в закрытых
каталогах и передавайте по SSH; не добавляйте их в Git или общедоступное хранилище.

### 15.2. Подготовка

На обоих VPS проверьте архитектуру, память, место и порты:

```bash
uname -m
free -h
df -h
docker --version
docker compose version
ss -tulpn | grep -E ':(80|443|8080|8082|8443)\b'
```

На новом сервере установите Docker по [разделу 3](#3-подключение-и-установка-docker).
Проверьте `docker run --rm hello-world`. Убедитесь, что есть место для архивов,
распакованных данных и образов. Проверьте доступ к registry и источникам.

На старом сервере:

```bash
cd /opt/tanuki
./tanuki status
docker compose ps -a
docker compose config --quiet
docker compose images
docker volume ls
du -sh /opt/tanuki
docker system df -v
grep -E '^(APP_URL|CADDY_SITE|WEB_BIND|HTTP_PORT|HTTPS_PORT|CADDY_TRUSTED_PROXIES|TANUKI_SUBNET_PREFIX|TANUKI_VERSION|COMPOSE_PROJECT_NAME)=' .env
```

Зафиксируйте версии и идентификаторы используемых образов, включая PostgreSQL и Valkey.
Проверьте, что имена volumes соответствуют Compose, а административные операции завершены.
Не выводите полные `.env`, `api.env` или результат `docker compose config` без `--quiet`:
они могут содержать секреты.

Если используется GitHub Actions, временно задайте `TANUKI_AUTO_DEPLOY=false` в Repository
Variables и дождитесь завершения уже запущенных деплоев. Не запускайте ручной update до
окончания миграции.

Заранее скачайте `docker pull alpine:3.22` на обоих серверах. Со старого VPS проверьте
`ssh root@NEW_IP`, сверив host key нового VPS с доверенной консолью, затем выйдите через
`exit`. Если прямой SSH невозможен, передайте архивы через доверенный компьютер.

Для установки из готового релиза API/web загружаются по digest из сохранённой конфигурации.
Для локальной сборки образы могут отсутствовать в registry: заранее перенесите их с
`docker image save` и `docker image load`, сохранив имена, теги и проверив идентификаторы.
Не пересобирайте приложение одновременно с переносом. Аналогично сохраните точные образы
PostgreSQL/Valkey, если исходные теги недоступны или изменились.

### 15.3. Backup и остановка

На старом сервере создайте штатную логическую резервную копию:

```bash
cd /opt/tanuki
./tanuki backup
ls -lh backups/
./tanuki status
```

CLI временно останавливает web/API, создаёт согласованный архив и снова запускает
приложение. Сохраните этот архив также вне старого VPS. Он нужен как дополнительная
страховка, а не как замена следующему шагу.

После подготовки нового VPS начните окно простоя:

```bash
cd /opt/tanuki
docker compose stop
docker compose ps --status running
```

Убедитесь, что все сервисы остановлены, включая PostgreSQL и оба Valkey, и другие
процессы не используют их volumes. Только после этого архивируйте данные.
Не запускайте старый Tanuki после переключения на новый: две независимые базы
начнут расходиться.

### 15.4. Архивирование и передача

На старом сервере:

```bash
(
  set -e
  umask 077
  mkdir -p /root/tanuki-migration
  chmod 700 /root/tanuki-migration

  tar -czpf /root/tanuki-migration/project.tar.gz -C /opt tanuki

  for volume in tanuki_postgres-data tanuki_valkey-data \
                tanuki_caddy-data tanuki_caddy-config
  do
    docker volume inspect "$volume" >/dev/null
    docker run --rm \
      -v "$volume":/source:ro \
      -v /root/tanuki-migration:/backup \
      alpine:3.22 \
      sh -ec 'umask 077; tar -czpf "/backup/$1.tar.gz" -C /source .' \
      sh "$volume"
  done

  cd /root/tanuki-migration
  sha256sum project.tar.gz tanuki_postgres-data.tar.gz \
    tanuki_valkey-data.tar.gz tanuki_caddy-data.tar.gz \
    tanuki_caddy-config.tar.gz > SHA256SUMS
  ls -lh
)
```

Должно получиться пять архивов и файл `SHA256SUMS`. При ошибке остановитесь и устраните
причину, не передавайте неполную копию.

```bash
scp -r /root/tanuki-migration root@NEW_IP:/root/
```

### 15.5. Восстановление на новом VPS

На новом сервере:

```bash
cd /root/tanuki-migration
chmod 700 /root/tanuki-migration
sha256sum -c SHA256SUMS
```

У всех пяти архивов должен быть результат `OK`. Распаковка рассчитана на новый сервер
без существующего каталога Tanuki и целевых volumes:

```bash
(
  set -e
  test ! -e /opt/tanuki
  for volume in tanuki_postgres-data tanuki_valkey-data \
                tanuki_caddy-data tanuki_caddy-config
  do
    if docker volume inspect "$volume" >/dev/null 2>&1; then
      echo "Volume уже существует: $volume" >&2
      exit 1
    fi
  done

  mkdir -p /opt
  tar --numeric-owner -xzpf /root/tanuki-migration/project.tar.gz -C /opt

  for volume in tanuki_postgres-data tanuki_valkey-data \
                tanuki_caddy-data tanuki_caddy-config
  do
    docker volume create \
      --label com.docker.compose.project=tanuki \
      --label com.docker.compose.volume="${volume#tanuki_}" \
      "$volume"
    docker run --rm \
      -v "$volume":/target \
      -v /root/tanuki-migration:/backup:ro \
      alpine:3.22 \
      tar -xzpf "/backup/$volume.tar.gz" -C /target
  done
)
```

Compose labels позволяют проекту распознавать восстановленные volumes. При ошибке
не повторяйте распаковку поверх частично восстановленной базы: сначала проверьте,
что уже создано. Никогда не используйте `docker compose down -v` на рабочем инстансе.

Проверьте конфигурацию и права:

```bash
cd /opt/tanuki
test -f .env && test -f api.env && test -f docker-compose.yml
chmod 600 .env api.env
ls -ldn data/libsocial-tokens
ls -ln data/libsocial-tokens
docker compose config --quiet
```

Токены должны оставаться доступными UID/GID API (1000:1000 в текущей поставке).
Обычно каталог имеет права 700, файлы — 600. При необходимости исправьте владельцев
адресно. Не выполняйте повторный `./tanuki install`: сохраните исходные секреты.

### 15.6. Порты, домен и запуск

Проверьте, что подсеть Compose не пересекается с сетями нового хоста и что
опубликованные порты свободны. Если Caddy обслуживает HTTPS самостоятельно, сохраняйте
его схему с 80/443; при смене домена обновите `APP_URL` и `CADDY_SITE` на новый адрес
и настройте DNS для получения сертификата.

Если HTTPS обслуживает внешний прокси, Caddy должен слушать только localhost.
Например, Nginx уже использует 8080, а TLS завершается на другом прокси на 443.
Для Tanuki можно выбрать 8082 и 8443, если они свободны:

```bash
ss -tulpn | grep -E ':(8082|8443)\b'
cd /opt/tanuki
```

При пустом выводе `ss` отредактируйте существующие значения в `.env`:

```dotenv
APP_URL=https://manga.example.org
CADDY_SITE=:8080
WEB_BIND=127.0.0.1
HTTP_PORT=8082
HTTPS_PORT=8443
COOKIE_SECURE=true
```

Это пример параметров, а не содержимое всего файла. Не заменяйте `.env` целиком.
`HTTP_PORT` меняет порт хоста, а внутренний HTTP-порт Caddy остаётся 8080.

Для релизной установки:

```bash
docker compose config --quiet
docker compose pull
```

Сравните скачанные образы с исходными версиями. Для локальной сборки используйте
заранее перенесённые образы вместо загрузки отсутствующих в registry тегов.
После успешной проверки запустите:

```bash
docker compose up -d
./tanuki status
docker compose ps -a
```

Дождитесь `healthy` у postgres, valkey, cache, api и web; migrate должен завершиться
с кодом 0. Для примера с внешним прокси проверьте локальный API:

```bash
curl -i http://127.0.0.1:8082/api/v1/health/ready
docker network inspect tanuki_default --format '{{json .IPAM.Config}}'
```

Ожидается HTTP 200 и `{"status":"ok"}`. Сверьте `CADDY_TRUSTED_PROXIES` с фактическим
IP/CIDR внешнего прокси, видимым Caddy. Docker gateway часто совпадает с ним, но это
нужно проверить. Не доверяйте всем приватным сетям. При изменении параметров пересоздайте
web через `docker compose up -d --no-deps --force-recreate web` и повторите проверки.

### 15.7. Внешний HTTPS-прокси: пример Nginx

Этот пример нужен только для схемы, где отдельный TLS-прокси (например, уже настроенный
Xray с HTTP fallback) завершает TLS на 443 и передаёт HTTP на `127.0.0.1:8080`.
Nginx передаёт запросы на Caddy `127.0.0.1:8082`. Для обычного Nginx с собственным
TLS используйте HTTPS server block; при прямом Caddy этот раздел не нужен.

Сохраните текущую конфигурацию Nginx и измените только нужные server blocks.
Не удаляйте другие сайты, ACME location и настройки существующего TLS-прокси.

```nginx
server {
    listen 80;
    server_name manga.example.org;
    return 301 https://manga.example.org$request_uri;
}

server {
    listen 127.0.0.1:8080;
    server_name manga.example.org;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
        proxy_buffering off;
        proxy_read_timeout 1h;
        proxy_send_timeout 300s;
        client_max_body_size 64m;
    }
}
```

Сверьте конфигурацию с [примером внешнего HTTPS-прокси](../README.md#внешний-https-прокси).
Лимит тела запроса должен соответствовать контракту API. Буферизация отключена для SSE.
`X-Forwarded-Proto https` корректен здесь, потому что входной TLS уже завершён.
Если входной прокси не передаёт исходный IP, Nginx может видеть localhost; проверяйте
real client IP и rate limiting отдельно. Не доверяйте произвольному клиентскому
X-Forwarded-For.

```bash
nginx -t && systemctl reload nginx
```

Если проверка не прошла, исправьте или восстановите прежнюю конфигурацию перед reload.
Для схемы с Xray дополнительно проверьте работу VPN и сертификат входного TLS:

```bash
openssl s_client -connect 127.0.0.1:443 \
  -servername manga.example.org </dev/null 2>/dev/null |
  openssl x509 -noout -subject -dates -ext subjectAltName

curl -i --http1.1 \
  --resolve manga.example.org:443:127.0.0.1 \
  https://manga.example.org/api/v1/health/ready
```

Не отключайте проверку TLS. При автоматическом получении нового сертификата Caddy
потребуется предварительно настроить DNS и доступ 80/443; проверяйте сертификат после
выдачи.

### 15.8. DNS и пользовательские данные

Если IP домена изменился, обновите A и при наличии AAAA. При плановом переносе
можно уменьшить TTL заранее. Не оставляйте AAAA для неработающего IPv6.

```bash
getent ahostsv4 manga.example.org
getent ahostsv6 manga.example.org
curl -i https://manga.example.org/api/v1/health/ready
```

Проверьте HTTP 200 также из другой сети. Если используется прежний домен, сохраняется
origin приложения. Если домен изменился, пользователям потребуется снова войти;
IndexedDB, офлайн-загрузки, Service Worker, несинхронизированный прогресс и подписки
Web Push остаются привязаны к старому origin. Серверная библиотека от этого не исчезает.

### 15.9. Переключение GitHub Actions на новый VPS

Если автообновление не используется, этот раздел можно пропустить. Для существующего
деплоя создавать новый релиз и менять workflow не требуется.

На новом VPS добавьте публичную часть существующего отдельного deploy key в
`/root/.ssh/authorized_keys`, не затирая другие ключи:

```bash
mkdir -p /root/.ssh
chmod 700 /root/.ssh
nano /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

Если публичный ключ отсутствует на компьютере, его можно найти на старом VPS в
`authorized_keys` или получить через `ssh-keygen -y -f PATH_TO_DEPLOY_KEY`.
Не переносите лишние ключи и приватные host keys. Если ключ утрачен или
скомпрометирован, создайте новую пару и замените также `DEPLOY_SSH_KEY`.

Получите отпечаток host key нового сервера через доверенную консоль:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

На своём компьютере:

```bash
ssh-keyscan -p 22 -t ed25519 NEW_IP > /tmp/tanuki-known-hosts
ssh-keygen -lf /tmp/tanuki-known-hosts
```

Сверьте отпечатки. В GitHub → Settings → Secrets and variables → Actions:

- `DEPLOY_HOST`: новый SSH-адрес.
- `DEPLOY_KNOWN_HOSTS`: проверенная полная строка вида `NEW_IP ssh-ed25519 <public key>`
  (при нестандартном порте формат `[NEW_IP]:PORT`).
- `DEPLOY_SSH_KEY`: не менять, если использован тот же соответствующий публичный ключ.
- `DEPLOY_PORT`: реальный SSH-порт (по умолчанию 22).
- `TANUKI_AUTO_DEPLOY`: пока `false`.

Не отключайте StrictHostKeyChecking и не публикуйте приватный ключ.

На новом VPS узнайте установленную версию готового релиза:

```bash
cd /opt/tanuki
grep '^TANUKI_VERSION=' release.env
```

В GitHub Actions → Deploy release to VPS → Run workflow укажите этот опубликованный
тег и `operation=stage`. Успех подтверждает SSH и доставку проверенного bundle в
`/opt/tanuki/.releases/<version>/`, но не выполнение update или миграций.
После проверки нового VPS включите `TANUKI_AUTO_DEPLOY=true`. Проверьте следующий
релиз и readiness после update. Подробнее — [SSH-деплой](16-github-actions-ssh-deploy.md).

### 15.10. Финальная проверка и откат

- [ ] Все рабочие контейнеры healthy, migrate завершён, внешний HTTPS возвращает HTTP 200.
- [ ] Существующий пользователь может войти, видит библиотеку, закладки, прогресс и настройки.
- [ ] Новые изменения сохраняются; работают каталог, изображения, главы и привязанные источники.
- [ ] Проверены SMTP, SSE и Web Push, если они настроены.
- [ ] Внешний прокси, DNS, сертификат и VPN (при наличии) работают.
- [ ] Проверен stage и включён автодеплой, если он используется.
- [ ] На новом VPS создан новый `./tanuki backup`, защищённая копия сохранена вне VPS.

Не удаляйте старый VPS до завершения проверок. После успешного переноса удалите
ненужные промежуточные архивы согласно своей политике хранения, оставив защищённую
резервную копию.

При откате отключите автодеплой и остановите Tanuki на новом VPS. Если там уже были
новые пользовательские записи, сначала сохраните новую базу и согласуйте восстановление:
простой возврат на старую БД потеряет эти изменения. Верните домен/DNS и SSH-настройки
GitHub на старый сервер при необходимости, затем на старом VPS выполните
`cd /opt/tanuki && docker compose up -d` и проверьте readiness. Не допускайте
одновременной работы двух независимых инстансов.

При повреждении копии используйте проверенный логический backup и процедуру
[восстановления](#12-первая-резервная-копия).

