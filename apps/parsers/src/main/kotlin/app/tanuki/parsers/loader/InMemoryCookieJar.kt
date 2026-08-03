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
        if (cookies.isEmpty()) return
        // Один и тот же хост может отдавать Set-Cookie несколько раз за одну редирект-цепочку
        // (например, антибот-кука на промежуточном хопе и обновлённая — на финальном) —
        // сливаем по имени куки, а не затираем весь список, иначе более ранняя кука с этого
        // же хоста (тот самый redirect-antibot случай из комментария выше) теряется.
        store.merge(url.host, cookies) { existing, incoming ->
            val merged = existing.associateByTo(LinkedHashMap()) { it.name }
            incoming.forEach { merged[it.name] = it }
            merged.values.toList()
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val cookies = store[url.host] ?: return emptyList()
        val now = System.currentTimeMillis()
        return cookies.filter { it.expiresAt > now }
    }

    /** Ищет куку по имени среди всех известных хостов — не привязана к конкретному домену. */
    fun findByName(name: String): Cookie? =
        store.values
            .asSequence()
            .flatten()
            .firstOrNull { it.name == name }
}
