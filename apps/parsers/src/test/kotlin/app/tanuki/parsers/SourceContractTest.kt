package app.tanuki.parsers

import app.tanuki.parsers.loader.TanukiMangaLoaderContext
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.koitharu.kotatsu.parsers.model.MangaListFilter
import org.koitharu.kotatsu.parsers.model.MangaParserSource
import kotlin.time.Duration.Companion.minutes

/**
 * Контрактные тесты источников (docs/08-roadmap.md, Фаза 2). Бьют по живым сайтам, поэтому
 * гоняются только в ночном CI (.github/workflows/parsers-nightly.yml), не на каждый PR.
 * Используют боевой TanukiMangaLoaderContext (не мок) и тот же вызов getList/getDetails/
 * getPages, что и Routes.kt — так тест проверяет нашу интеграцию, а не библиотеку саму по себе.
 */
class SourceContractTest {
    private val loaderContext = TanukiMangaLoaderContext()

    @ParameterizedTest
    @EnumSource(
        MangaParserSource::class,
        names = ["READMANGA_RU", "MINTMANGA", "SELFMANGA", "REMANGA", "DESUME", "MANGALIB"],
    )
    fun `source returns list, details and pages`(source: MangaParserSource) =
        runTest(timeout = 2.minutes) {
            val parser = loaderContext.newParserInstance(source)

            val list =
                loaderContext.withParser(parser) {
                    parser.getList(offset = 0, order = parser.availableSortOrders.first(), filter = MangaListFilter())
                }
            assertTrue(list.isNotEmpty()) { "$source: getList() returned empty list" }
            assertTrue(list.all { it.source == source }) { "$source: list item with wrong source" }

            val seed = list.first()
            val details = loaderContext.withParser(parser) { parser.getDetails(seed) }
            val chapters = details.chapters.orEmpty()
            assertTrue(chapters.isNotEmpty()) { "$source: getDetails() returned no chapters" }
            assertTrue(details.publicUrl.startsWith("http")) { "$source: publicUrl is not absolute" }

            val firstChapter = chapters.first()
            val pages = loaderContext.withParser(parser) { parser.getPages(firstChapter) }
            assertTrue(pages.isNotEmpty()) { "$source: getPages() returned no pages" }
            pages.forEach { page ->
                val absoluteUrl = runCatching { parser.getPageUrl(page) }.getOrDefault(page.url)
                assertTrue(absoluteUrl.startsWith("http")) { "$source: page url is not absolute" }
            }
        }
}
