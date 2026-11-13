# Доставка приватного Tanuki Release на VPS через GitHub Actions

Репозиторий `Gabageba/tanuki` остаётся приватным. GitHub Actions скачивает опубликованный релиз по `GITHUB_TOKEN`, сверяет SHA256 и отправляет пакет на VPS через SSH. GitHub-токен на сервере не нужен, а Docker-образы загружаются из публичного GHCR.

## Выпуск и обновления

Отправка нового тега `vX.Y.Z` запускает `.github/workflows/release.yml`. После CI, сборки образов и native smoke workflow автоматически публикует релиз. Если проверка завершается ошибкой, релиз не публикуется и доставка не запускается.

Когда в Actions Variables задано `TANUKI_AUTO_DEPLOY=true`, job `deploy` вызывает `.github/workflows/deploy.yml` в рамках того же workflow. Он загружает артефакты `docker-compose.yml`, `release.env`, `SHA256SUMS`, `tanuki`, проверяет контрольные суммы и передаёт их в `/opt/tanuki/.releases/<version>/`.

При существующих `/opt/tanuki/.env` и `/opt/tanuki/api.env` выполняется `tanuki update` с локально подготовленным релизом. Если Tanuki ещё не установлен, пакет только передаётся на сервер. Вручную запускать миграции на первый раз нельзя: перед этим нужно пройти интерактивную установку.

До проверки первого развёртывания **не включайте** `TANUKI_AUTO_DEPLOY`.

## Подготовка SSH

Создайте на Mac отдельный ключ без passphrase для GitHub Actions:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/tanuki-github-deploy -C "tanuki-github-actions"
```

Публичный ключ из `~/.ssh/tanuki-github-deploy.pub` добавьте в `/root/.ssh/authorized_keys` на VPS. Используйте адрес, по которому уже работает SSH; `vm232656` само по себе не обязательно является DNS-именем.

```bash
cat ~/.ssh/tanuki-github-deploy.pub | ssh root@YOUR_VPS_HOST 'umask 077; mkdir -p ~/.ssh; chmod 700 ~/.ssh; cat >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys'
ssh -i ~/.ssh/tanuki-github-deploy root@YOUR_VPS_HOST 'id -u'
```

Последняя команда должна вывести `0`. При нестандартном SSH-порте добавьте `-p PORT`.

Проверьте fingerprint публичного host key **на самом VPS**:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

На Mac получите и проверьте host key удалённой машины:

```bash
ssh-keyscan -t ed25519 -p 22 YOUR_VPS_HOST > /tmp/tanuki-known-hosts
ssh-keygen -lf /tmp/tanuki-known-hosts
```

Сравните fingerprint с результатом на VPS. Не доверяйте выводу `ssh-keyscan` без проверки.

В GitHub Settings → Secrets and variables → Actions добавьте три repository secrets: `DEPLOY_HOST` (публичный SSH-адрес VPS), `DEPLOY_SSH_KEY` (полное содержимое приватного ключа Mac, включая заголовки) и `DEPLOY_KNOWN_HOSTS` (проверенное содержимое `/tmp/tanuki-known-hosts`). Если порт не 22, задайте repository variable `DEPLOY_PORT`.

Приватный SSH-ключ не должен попадать в чат, Vault, исходный код или логи. Его компрометация опасна: этот ключ предоставляет root SSH-доступ. Если сервер доступен только по VPN или SSH-адрес недоступен из GitHub-hosted runners, доставка завершится ошибкой.

## Первая установка v1.0.0

После объединения PR с `master` откройте GitHub Actions → Deploy release to VPS → Run workflow. Выберите `version=v1.0.0`, `operation=stage`. Это только передаёт готовый пакет на VPS, не меняя VPN и не запуская контейнеры.

На VPS:

```bash
ls -la /opt/tanuki/.releases/v1.0.0
cd /opt/tanuki
install -m 700 .releases/v1.0.0/tanuki-deploy ./tanuki
```

**Перед установкой** проверьте, что Xray и VPN работают, а HTTP fallback действительно направляется на `8080`. Tanuki с `--external-proxy` занимает локальные порты 8080 и 8443, не 443. Домен приложения должен соответствовать TLS-сертификату Xray.

```bash
cd /opt/tanuki
TANUKI_RELEASE_DIR=/opt/tanuki/.releases/v1.0.0 ./tanuki install --external-proxy
```

Установка запросит домен, SMTP и IP/CIDR доверенного прокси. Последний должен совпадать с адресом, который Caddy реально видит. Для Docker это часто gateway сети Compose `172.30.98.1/32`, но это нужно проверять через `docker network inspect`. Не доверяйте всем приватным сетям. Скрипт самостоятельно создаст секреты.

После установки:

```bash
cd /opt/tanuki
./tanuki status
./tanuki admin-invite
```

Проверьте внешний HTTPS, доступность API, работу VPN и создание администратора. Затем включите Actions variable `TANUKI_AUTO_DEPLOY=true` для следующих релизов.

## Обновления и ограничения

При следующем теге Release job вызовет Deploy job только после успешных проверок и публикации. `tanuki update` загружает образы по digest, создаёт резервную копию, выполняет миграции и проверяет готовность сервисов. Для ручного вызова используйте `operation=update`; `operation=stage` только копирует файлы.

В случае ошибки миграции автоматический откат не выполняется: используйте инструкцию `restore`, которую выведет управляющий скрипт. Не используйте `docker compose down -v`, иначе могут быть удалены данные приложения.

Изменения в механизме доставки не требуют пересборки Docker-образов `v1.0.0`. Первый запуск остаётся интерактивным. GitHub Actions не меняет конфигурацию Xray, но ресурсы Tanuki и VPN используются на одном VPS.
