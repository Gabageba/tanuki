package app.tanuki.parsers.loader

import kotlinx.coroutines.asContextElement
import kotlinx.coroutines.withContext
import okhttp3.CookieJar
import okhttp3.Dispatcher
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.koitharu.kotatsu.parsers.MangaLoaderContext
import org.koitharu.kotatsu.parsers.MangaParser
import org.koitharu.kotatsu.parsers.bitmap.Bitmap
import org.koitharu.kotatsu.parsers.config.MangaSourceConfig
import org.koitharu.kotatsu.parsers.model.MangaSource
import java.awt.image.BufferedImage
import java.util.concurrent.AbstractExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.imageio.ImageIO

private const val DEFAULT_USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

/**
 * MangaLoaderContext для серверного окружения без Android WebView.
 *
 * Риск Фазы 1 подтвердился на практике (см. docs/01-architecture.md, "Главный риск фазы"):
 * LibSocialParser (MANGALIB) безусловно дёргает [evaluateJs] на каждый запрос — не для
 * скрейпинга контента, а чтобы проверить localStorage на сохранённый auth-токен (best-effort,
 * "залогинен ли пользователь через WebView"). Без WebView-инфраструктуры единственный
 * корректный ответ — null (аноним, как и должно быть для сайдкара без пользовательских
 * сессий), а не исключение, которое обрушивает даже гостевые запросы.
 */
class TanukiMangaLoaderContext : MangaLoaderContext() {
    // AbstractMangaParser builds its webClient directly from this shared OkHttpClient
    // (see kotatsu-parsers' AbstractMangaParser: `OkHttpWebClient(context.httpClient, source)`),
    // never adding the parser instance itself as an interceptor. That means a parser's own
    // `intercept()` override (e.g. LibSocialParser adding the "Site-Id" header MangaLib's API
    // requires to disambiguate manga/hentai/slash lookups) is silently never invoked, and
    // requests fail with a misleading upstream 404. `currentParser` plus the dispatching
    // interceptor below is what actually wires it up.
    //
    // OkHttpWebClient issues requests via `call.enqueue()` (see its `.await()` helper), which
    // runs the interceptor chain on OkHttp's own Dispatcher executor thread — not on whatever
    // coroutine dispatcher thread called it. A plain ThreadLocal (even coroutine-context-aware
    // via asContextElement) never reaches that thread, so the custom dispatcher below snapshots
    // the value at the moment a call is submitted (still on the calling coroutine's thread) and
    // restores it once the task actually runs on the pool thread.
    private val currentParser = ThreadLocal<MangaParser?>()

    override val cookieJar: CookieJar = InMemoryCookieJar()

    override val httpClient: OkHttpClient =
        OkHttpClient
            .Builder()
            .cookieJar(cookieJar)
            .dispatcher(parserPropagatingDispatcher())
            .addInterceptor(userAgentInterceptor())
            .addInterceptor { chain -> currentParser.get()?.intercept(chain) ?: chain.proceed(chain.request()) }
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .build()

    suspend fun <T> withParser(
        parser: MangaParser,
        block: suspend () -> T,
    ): T = withContext(currentParser.asContextElement(parser)) { block() }

    private fun parserPropagatingDispatcher(): Dispatcher {
        val pool = Executors.newCachedThreadPool()
        val propagating =
            object : AbstractExecutorService() {
                override fun execute(command: Runnable) {
                    val snapshot = currentParser.get()
                    pool.execute {
                        val previous = currentParser.get()
                        currentParser.set(snapshot)
                        try {
                            command.run()
                        } finally {
                            currentParser.set(previous)
                        }
                    }
                }

                override fun shutdown() = pool.shutdown()

                override fun shutdownNow(): MutableList<Runnable> = pool.shutdownNow()

                override fun isShutdown() = pool.isShutdown

                override fun isTerminated() = pool.isTerminated

                override fun awaitTermination(
                    timeout: Long,
                    unit: TimeUnit,
                ) = pool.awaitTermination(timeout, unit)
            }
        return Dispatcher(propagating)
    }

    private fun userAgentInterceptor() =
        Interceptor { chain ->
            val request =
                chain
                    .request()
                    .newBuilder()
                    .header("User-Agent", getDefaultUserAgent())
                    .build()
            chain.proceed(request)
        }

    @Suppress("OVERRIDE_DEPRECATION")
    override suspend fun evaluateJs(script: String): String? = evaluateJs("", script, 30_000L)

    override suspend fun evaluateJs(
        baseUrl: String,
        script: String,
        timeout: Long,
    ): String? = null

    override fun getConfig(source: MangaSource): MangaSourceConfig = StatelessMangaSourceConfig()

    override fun getDefaultUserAgent(): String = DEFAULT_USER_AGENT

    override fun redrawImageResponse(
        response: Response,
        redraw: (Bitmap) -> Bitmap,
    ): Response {
        val body = checkNotNull(response.body) { "Response has no body" }
        val srcImage = body.byteStream().use { ImageIO.read(it) }
        checkNotNull(srcImage) { "Cannot decode image" }
        val result = redraw(BitmapImpl(srcImage)) as BitmapImpl
        return response
            .newBuilder()
            .body(result.toPngBytes().toResponseBody("image/png".toMediaTypeOrNull()))
            .build()
    }

    override fun createBitmap(
        width: Int,
        height: Int,
    ): Bitmap = BitmapImpl(BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB))
}
