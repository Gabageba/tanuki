package app.tanuki.parsers

import app.tanuki.parsers.loader.TanukiMangaLoaderContext
import app.tanuki.parsers.routes.registerRoutes
import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.databind.JsonSerializer
import com.fasterxml.jackson.databind.SerializerProvider
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ktor.serialization.jackson.jackson
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8080
    embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module).start(wait = true)
}

fun Application.module() {
    install(ContentNegotiation) {
        jackson {
            registerModule(KotlinModule.Builder().build())
            // Manga.branches у part-парсеров может содержать null-ключ (единственная команда
            // перевода без явного имени) — по умолчанию Jackson падает на этом посреди уже
            // отправленного chunked-ответа (заголовки 200 не откатить), и клиент получает
            // оборванное соединение вместо валидной ошибки. branches всё равно не используется
            // BFF (apps/api сам считает branches из chapters), так что null-ключ отдаём как "".
            serializerProvider.setNullKeySerializer(
                object : JsonSerializer<Any?>() {
                    override fun serialize(
                        value: Any?,
                        gen: JsonGenerator,
                        serializers: SerializerProvider,
                    ) {
                        gen.writeFieldName("")
                    }
                },
            )
        }
    }

    val loaderContext = TanukiMangaLoaderContext()
    registerRoutes(loaderContext)
}
