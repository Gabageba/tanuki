package app.tanuki.parsers.routes

import app.tanuki.parsers.loader.TanukiMangaLoaderContext
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.response.respond
import io.ktor.server.routing.RoutingContext
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import org.koitharu.kotatsu.parsers.model.Manga
import org.koitharu.kotatsu.parsers.model.MangaChapter
import org.koitharu.kotatsu.parsers.model.MangaListFilter
import org.koitharu.kotatsu.parsers.model.MangaPage
import org.koitharu.kotatsu.parsers.model.MangaParserSource
import org.koitharu.kotatsu.parsers.model.RATING_UNKNOWN
import org.koitharu.kotatsu.parsers.model.SortOrder

private data class SourceInfo(
    val id: String,
    val title: String,
    val locale: String,
    val contentType: String,
    val isBroken: Boolean,
    val sortOrders: List<String>,
    val isSearchSupported: Boolean,
    val isMultipleTagsSupported: Boolean,
)

/**
 * Тонкая обёртка контракта из docs/03-parsers.md: принял запрос → вызвал MangaParser →
 * отдал JSON. Никакой нормализации, никакого кеша — это забота BFF (apps/api).
 */
fun Application.registerRoutes(loaderContext: TanukiMangaLoaderContext) {
    routing {
        get("/health") {
            call.respond(mapOf("status" to "ok"))
        }

        get("/sources") {
            val items =
                MangaParserSource.entries.mapNotNull { source ->
                    runCatching {
                        val parser = loaderContext.newParserInstance(source)
                        SourceInfo(
                            id = source.name,
                            title = source.title,
                            locale = source.locale,
                            contentType = source.contentType.name,
                            isBroken = source.isBroken,
                            sortOrders = parser.availableSortOrders.map { it.name },
                            isSearchSupported = parser.filterCapabilities.isSearchSupported,
                            isMultipleTagsSupported = parser.filterCapabilities.isMultipleTagsSupported,
                        )
                    }.getOrNull()
                }
            call.respond(mapOf("items" to items))
        }

        get("/sources/{id}/list") {
            val source = resolveSource() ?: return@get
            val parser = loaderContext.newParserInstance(source)
            val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 0
            val order =
                call.request.queryParameters["order"]
                    ?.let { name -> runCatching { SortOrder.valueOf(name) }.getOrNull() }
                    ?: parser.availableSortOrders.firstOrNull()
                    ?: SortOrder.UPDATED
            val query = call.request.queryParameters["query"]
            val filter = MangaListFilter(query = query)
            respondCatching {
                loaderContext.withParser(parser) {
                    mapOf("items" to parser.getList(offset = page * 20, order = order, filter = filter))
                }
            }
        }

        get("/sources/{id}/details") {
            val source = resolveSource() ?: return@get
            val url = requireParam("url") ?: return@get
            val parser = loaderContext.newParserInstance(source)
            respondCatching {
                val seed =
                    Manga(
                        id = 0L,
                        title = "",
                        altTitles = emptySet(),
                        url = url,
                        publicUrl = url,
                        rating = RATING_UNKNOWN,
                        contentRating = null,
                        coverUrl = null,
                        tags = emptySet(),
                        state = null,
                        authors = emptySet(),
                        source = source,
                    )
                loaderContext.withParser(parser) { parser.getDetails(seed) }
            }
        }

        get("/sources/{id}/pages") {
            val source = resolveSource() ?: return@get
            val chapterUrl = requireParam("chapterUrl") ?: return@get
            val parser = loaderContext.newParserInstance(source)
            respondCatching {
                val chapter =
                    MangaChapter(
                        id = 0L,
                        title = null,
                        number = 0f,
                        volume = 0,
                        url = chapterUrl,
                        scanlator = null,
                        uploadDate = 0L,
                        branch = null,
                        source = source,
                    )
                // Резолвим финальный абсолютный URL картинки здесь, а не заставляем BFF
                // делать по одному round-trip'у на страницу через /page-url.
                loaderContext.withParser(parser) {
                    val resolved =
                        parser.getPages(chapter).map { page ->
                            val absoluteUrl = runCatching { parser.getPageUrl(page) }.getOrDefault(page.url)
                            page.copy(url = absoluteUrl)
                        }
                    mapOf("items" to resolved)
                }
            }
        }

        get("/sources/{id}/page-url") {
            val source = resolveSource() ?: return@get
            val pageUrl = requireParam("pageUrl") ?: return@get
            val parser = loaderContext.newParserInstance(source)
            respondCatching {
                val page = MangaPage(id = 0L, url = pageUrl, preview = null, source = source)
                loaderContext.withParser(parser) { mapOf("url" to parser.getPageUrl(page)) }
            }
        }

        get("/sources/{id}/tags") {
            val source = resolveSource() ?: return@get
            val parser = loaderContext.newParserInstance(source)
            respondCatching {
                loaderContext.withParser(parser) {
                    mapOf("items" to parser.getFilterOptions().availableTags)
                }
            }
        }
    }
}

private suspend fun RoutingContext.resolveSource(): MangaParserSource? {
    val id = call.parameters["id"]
    val source = id?.let { runCatching { MangaParserSource.valueOf(it) }.getOrNull() }
    if (source == null) {
        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Unknown source: $id"))
    }
    return source
}

private suspend fun RoutingContext.requireParam(name: String): String? {
    val value = call.request.queryParameters[name]
    if (value.isNullOrEmpty()) {
        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Query parameter '$name' is required"))
        return null
    }
    return value
}

private suspend fun RoutingContext.respondCatching(block: suspend () -> Any) {
    try {
        call.respond(block())
    } catch (e: UnsupportedOperationException) {
        call.respond(HttpStatusCode.NotImplemented, mapOf("error" to (e.message ?: "not supported")))
    } catch (e: Exception) {
        call.respond(HttpStatusCode.BadGateway, mapOf("error" to (e.message ?: "parser failed")))
    }
}
