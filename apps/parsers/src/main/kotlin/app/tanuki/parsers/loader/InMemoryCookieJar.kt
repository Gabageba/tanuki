package app.tanuki.parsers.loader

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import java.util.concurrent.ConcurrentHashMap

/**
 * Сайдкар stateless между запросами, но кука за время одного запроса (например,
 * антибот-челлендж по редиректам) должна сохраняться. Живёт только в памяти процесса.
 */
class InMemoryCookieJar : CookieJar {
    private val store = ConcurrentHashMap<String, List<Cookie>>()

    override fun saveFromResponse(
        url: HttpUrl,
        cookies: List<Cookie>,
    ) {
        store[url.host] = cookies
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val cookies = store[url.host] ?: return emptyList()
        val now = System.currentTimeMillis()
        return cookies.filter { it.expiresAt > now }
    }
}
