package app.tanuki.parsers

import app.tanuki.parsers.loader.InMemoryCookieJar
import app.tanuki.parsers.loader.TanukiMangaLoaderContext
import app.tanuki.parsers.loader.authenticateGrouple
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory

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

    // Grouple-сеть (MintManga, Readmanga, SelfManga) прячет часть глав за логином
    // (GroupleParser.checkIfAuthRequired) — без учётки сайдкар навсегда получает
    // AuthRequiredException на таких главах. Логин необязателен: без переменных
    // окружения источники продолжают работать анонимно, как раньше.
    val groupleUsername = System.getenv("GROUPLE_USERNAME")
    val grouplePassword = System.getenv("GROUPLE_PASSWORD")
    if (!groupleUsername.isNullOrBlank() && !grouplePassword.isNullOrBlank()) {
        CoroutineScope(Dispatchers.IO).launch {
            runCatching {
                authenticateGrouple(
                    loaderContext.httpClient,
                    loaderContext.cookieJar as InMemoryCookieJar,
                    groupleUsername,
                    grouplePassword,
                )
            }.onFailure { e -> LoggerFactory.getLogger("Application").error("Grouple login failed", e) }
        }
    }

    registerRoutes(loaderContext)
}
