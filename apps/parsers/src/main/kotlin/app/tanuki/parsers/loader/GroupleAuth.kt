package app.tanuki.parsers.loader

import okhttp3.FormBody
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("GroupleAuth")

// Сайты на общем SSO-шлюзе 3.grouple.co (см. GroupleParser.authUrl в форке парсеров).
// AllHentai использует отдельный шлюз (qawa.org) и не входит в ENABLED_SOURCES по
// умолчанию, поэтому здесь не участвует. Первый домен в каждой группе — тот, что
// парсер реально использует по умолчанию (ConfigKey.Domain берёт первый пресет).
private val GROUPLE_DOMAINS =
    listOf(
        "3.grouple.co",
        "2.mintmanga.one",
        "24.mintmanga.one",
        "mintmanga.live",
        "mintmanga.com",
        "a.zazaza.me",
        "3.readmanga.ru",
        "1.selfmanga.live",
        "selfmanga.live",
    )

/**
 * Логинится через SSO-шлюз Grouple-сети и раскладывает полученную JWT-куку `gwt` по
 * доменам всех поддерживаемых источников сети. Кука самодостаточна (подписанный JWT с
 * id/username аккаунта) и не привязана к конкретному сайту, но GroupleParser.hasAuthCookie()
 * ищет её на домене конкретного источника, а InMemoryCookieJar матчит куки строго по хосту
 * запроса — без явного копирования её увидел бы только домен логина.
 */
suspend fun authenticateGrouple(
    httpClient: OkHttpClient,
    cookieJar: InMemoryCookieJar,
    username: String,
    password: String,
) {
    val siteId = 2
    val body =
        FormBody
            .Builder()
            .add("targetUri", "/login/continueSso?siteId=$siteId&targetUri=%2F")
            .add("username", username)
            .add("password", password)
            .add("remember_me", "true")
            .add("_remember_me_yes", "")
            .add("remember_me_yes", "on")
            .build()
    val request =
        Request
            .Builder()
            .url("https://3.grouple.co/login/authenticate?ttt=${System.currentTimeMillis()}&siteId=$siteId")
            .header("Origin", "https://3.grouple.co")
            .header("Referer", "https://3.grouple.co/internal/auth/login?siteId=$siteId")
            .post(body)
            .build()

    httpClient.newCall(request).execute().use { response ->
        if (!response.isSuccessful) {
            logger.warn("Grouple login request failed: HTTP {}", response.code)
        }
    }

    val gwt = cookieJar.findByName("gwt")
    if (gwt == null) {
        logger.warn("Grouple login did not yield a 'gwt' cookie — credentials likely rejected")
        return
    }
    for (domain in GROUPLE_DOMAINS) {
        val copy = gwt.newBuilder().domain(domain).build()
        cookieJar.saveFromResponse(
            HttpUrl
                .Builder()
                .scheme("https")
                .host(domain)
                .build(),
            listOf(copy),
        )
    }
    logger.info("Grouple SSO session established for {} sites", GROUPLE_DOMAINS.size)
}
