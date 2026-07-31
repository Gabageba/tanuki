FROM gradle:9.0.0-jdk21 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY src ./src
RUN gradle installDist --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Let's Encrypt запустил новую иерархию "Generation Y" (ISRG Root YE/YR) в январе
# 2026 — некоторые источники (например DESUME) уже используют её, а бандл cacerts
# в этом образе JRE ещё не обновлён и не знает про кросс-подписанный Root YE.
# Без этого сертификата парсер падает с PKIX path building failed на TLS-хендшейке.
COPY isrg-root-ye.pem /tmp/isrg-root-ye.pem
RUN keytool -importcert -noprompt -alias isrg-root-ye \
    -file /tmp/isrg-root-ye.pem \
    -keystore "$JAVA_HOME/lib/security/cacerts" -storepass changeit \
    && rm /tmp/isrg-root-ye.pem

COPY --from=build /app/build/install/parsers ./
EXPOSE 8080
ENTRYPOINT ["./bin/parsers"]
