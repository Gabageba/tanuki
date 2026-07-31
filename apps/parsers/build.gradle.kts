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
    // Наш форк с патчами (rich-text summary и cover/id в getDetails в LibSocialParser, домен desu.uno) —
    // собирается JitPack'ом из коммита напрямую, без ручной пересборки jar.
    // При обновлении форка достаточно поменять хэш коммита/тег на актуальный.
    implementation("com.github.Gabageba:tanuki-parsers-redo:e70d437")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("com.squareup.okhttp3:okhttp:5.1.0")

    implementation("io.ktor:ktor-server-core-jvm:3.5.1")
    implementation("io.ktor:ktor-server-netty-jvm:3.5.1")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:3.5.1")
    implementation("io.ktor:ktor-serialization-jackson-jvm:3.5.1")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.22.1")

    implementation("ch.qos.logback:logback-classic:1.6.1")
}

tasks.test {
    useJUnitPlatform()
}
