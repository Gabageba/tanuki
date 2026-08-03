plugins {
    kotlin("jvm") version "2.2.10"
    application
    id("org.jlleitschuh.gradle.ktlint") version "14.2.0"
}

group = "app.tanuki"
version = "0.0.0"

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("app.tanuki.parsers.ApplicationKt")
}

dependencies {
    // Наш форк с патчами (rich-text summary и cover/id в getDetails в LibSocialParser, домен desu.uno;
    // coverUrl в getDetails для DesuMe и Grouple-сайтов после редизайна разметки; SelfMangaParser
    // теперь резолвит домен как 1.selfmanga.live — сайт стал 301-редиректить selfmanga.live туда,
    // и toRelativeUrl() в GroupleParser.parseManga молча отбрасывал все тайтлы из-за несовпадения
    // хоста; DesuMeParser переписан под HTML desu.uno — старый /manga/api/ отключён (410
    // api_deprecated), сайт переехал на XenForo; coverUrl в getDetails для DesuMe снова
    // потерялся при переписывании под HTML и восстановлен отдельным коммитом) — собирается
    // JitPack'ом из коммита напрямую, без ручной пересборки jar. При обновлении форка
    // достаточно поменять хэш коммита/тег.
    implementation("com.github.Gabageba:tanuki-parsers-redo:66f4374")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("com.squareup.okhttp3:okhttp:5.1.0")

    implementation("io.ktor:ktor-server-core-jvm:3.5.1")
    implementation("io.ktor:ktor-server-netty-jvm:3.5.1")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:3.5.1")
    implementation("io.ktor:ktor-serialization-jackson-jvm:3.5.1")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.22.1")

    implementation("ch.qos.logback:logback-classic:1.6.1")

    // Контрактные тесты источников (docs/08-roadmap.md, Фаза 2) — бьют по живым сайтам,
    // гоняются в apps/parsers/src/test, только в ночном CI.
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.12.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
}

tasks.test {
    useJUnitPlatform()
}
