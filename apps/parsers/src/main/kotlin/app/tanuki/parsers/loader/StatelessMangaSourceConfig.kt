package app.tanuki.parsers.loader

import org.koitharu.kotatsu.parsers.config.ConfigKey
import org.koitharu.kotatsu.parsers.config.MangaSourceConfig

/**
 * Сайдкар не хранит пользовательские настройки источника — всегда дефолты парсера.
 */
class StatelessMangaSourceConfig : MangaSourceConfig {
    override fun <T> get(key: ConfigKey<T>): T = key.defaultValue
}
