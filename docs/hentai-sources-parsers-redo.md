# Хентай-источники в parsers-redo, которых нет в tanuki

Снимок сравнения `@tanuki/contracts` `SOURCE_CATALOG` (источники с `contentType: HENTAI`) против
всех парсеров с `type = ContentType.HENTAI` в форке
[`Gabageba/tanuki-parsers-redo`](https://github.com/Gabageba/tanuki-parsers-redo) — на 2026-09-02.
Отфильтровано под языки: универсальные (без привязки к языку), английские, русские, японские,
корейские, китайские — остальные ~180 источников (id/pt/vi/es/tr/fr/ar/th/uk/cs) вне рассмотрения.

Контекст: `packages/parsers` умышленно портирует только 23 RU-источника форка ([03 —
Слой парсеров](03-parsers.md)) — из тысячи с лишним источников библиотеки нужны русские. Список
ниже — не бэклог «надо добавить», а справочный срез того, что осталось за бортом этого решения,
на случай если понадобится расширить хентай-каталог отдельно.

## Уже есть в tanuki (совпадают с форком)

AllHentai, Хентай-тян (HenChan), HentaiLib, Nude-Moon, Multporn — 5 из 6 текущих
`contentType: HENTAI` записей каталога. `hentaichan_cc` (`hentaichan.cc`) в форке отсутствует —
похоже, наша собственная добавка вне форка. Ниже эти пять не повторяются.

## Универсальные источники (без привязки к языку) — 17

Не завязаны на регион — контентом преимущественно японские/переводные додзинси-галереи. У части
жёсткий Cloudflare/rate-limit или нужна авторизация (ExHentai).

| id                 | название       | домен                                       | движок        |
| ------------------ | -------------- | ------------------------------------------- | ------------- |
| HENTAI3            | 3Hentai        | 3hentai.net                                 | GalleryAdults |
| NINENINENINEHENTAI | AnimeH         | animeh.to                                   | — (одиночный) |
| ASMHENTAI          | AsmHentai      | asmhentai.com                               | GalleryAdults |
| DOUJINDESUUK       | DoujinDesu.uk  | doujindesu.uk                               | GalleryAdults |
| EXHENTAI           | ExHentai       | exhentai.org (e-hentai.org без авторизации) | — (одиночный) |
| HENTAIENVY         | HentaiEnvy     | hentaienvy.com                              | GalleryAdults |
| HENTAIERA          | HentaiEra      | hentaiera.com                               | GalleryAdults |
| HENTAIFORCE        | HentaiForce    | hentaiforce.net                             | GalleryAdults |
| HENTAIFOX          | HentaiFox      | hentaifox.com                               | GalleryAdults |
| HENTAIROX          | HentaiRox      | hentairox.com                               | GalleryAdults |
| HITOMILA           | Hitomi.La      | hitomi.la                                   | — (одиночный) |
| IMHENTAI           | ImHentai       | imhentai.xxx                                | — (одиночный) |
| MYREADINGMANGA     | MyReadingManga | myreadingmanga.info                         | — (одиночный) |
| NHENTAI            | NHentai.net    | nhentai.net                                 | GalleryAdults |
| NHENTAI_TO         | NHentai.to     | nhentai.to                                  | GalleryAdults |
| NHENTAI_XXX        | NHentai.xxx    | nhentai.xxx                                 | GalleryAdults |
| KOHARU             | Schale.network | niyaniya.moe                                | — (одиночный) |

## Английские — 92

| id               | название          | домен                     | движок        |
| ---------------- | ----------------- | ------------------------- | ------------- |
| PORNCOMIC18      | 18PornComic       | 18porncomic.com           | Manga18       |
| ADULT_WEBTOON    | AdultWebtoon      | adultwebtoon.com          | Madara        |
| ALLPORN_COMIC    | AllPornComic      | allporncomic.com          | Madara        |
| BEEHENTAI        | BeeHentai         | beehentai.com             | MadTheme      |
| BIBIMANGA        | BibiManga         | bibimanga.com             | Madara        |
| BOYS_LOVE        | BoysLove          | boyslove.me               | Madara        |
| COCOMIC          | CoComic           | cocomic.co                | Madara        |
| COMICSVALLEY     | ComicsValley      | comicsvalley.com          | Madara        |
| COMIZ            | Comiz             | v2.comiz.net              | Madara        |
| CONSTELLARCOMIC  | ConstellarComic   | constellarcomic.com       | MangaReader   |
| DECADENCESCANS   | DecadenceScans    | reader.decadencescans.com | Madara        |
| DEXHENTAI        | DexHentai         | dexhentai.com             | MangaReader   |
| DUCKMANGA        | DuckManga         | duckmanga.com             | Madara        |
| EDOUJIN          | EHentaiManga      | ehentaimanga.com          | MangaReader   |
| FREECOMICONLINE  | FreeComicOnline   | freecomiconline.me        | Madara        |
| GEDECOMIX        | GedeComix         | gedecomix.com             | Madara        |
| HACHIRUMI        | Hachirumi         | hachirumi.com             | Guya          |
| HENTAIXCOMIC     | Hentai x Comic    | hentaixcomic.com          | Madara        |
| HENTAIXDICKGIRL  | Hentai x Dickgirl | hentaixdickgirl.com       | Madara        |
| HENTAI20         | Hentai20          | hentai20.io               | MangaReader   |
| HENTAI3Z         | Hentai3z          | manga18h.xyz              | Madara        |
| HENTAI3ZCC       | Hentai3z.cc       | hentai3z.cc               | Manga18       |
| HENTAI_4FREE     | Hentai4Free       | hentai4free.net           | Madara        |
| HENTAIMANGA      | HentaiManga       | hentaimanga.me            | Madara        |
| HENTAINEXUS      | HentaiNexus       | hentainexus.com           | GalleryAdults |
| HENTAIREAD       | HentaiRead        | hentairead.com            | GalleryAdults |
| HENTAIWEBTOON    | HentaiWebtoon     | hentaiwebtoon.com         | Madara        |
| HENTAIXYURI      | HentaiXYuri       | hentaixyuri.com           | Madara        |
| HENTALK          | Hentalk           | hentalk.pw                | — (одиночный) |
| HEYTOON          | HeyToon           | heytoon.net               | — (одиночный) |
| HIPERDEX         | HiperToon         | hiperdex.com              | Madara        |
| INSTAMANHWA      | InstaManhwa       | www.manhwaden.com         | Madara        |
| KIARA18          | Kiara18           | 18.kiara.cool             | Madara        |
| LILYMANGA        | LilyManga         | lilymanga.net             | Madara        |
| LOLICONMOBI      | LoliconMobi       | lolicon.mobi              | Madara        |
| LUNAR_SCAN       | LunarScan.org     | lunarscan.org             | MangaReader   |
| MADARADEX        | MadaraDex         | madaradex.org             | Madara        |
| MANGA18          | Manga18           | manga18.club              | Manga18       |
| MANGA18XYZ       | Manga18.xyz       | manga18.xyz               | Madara        |
| MANGA18H         | Manga18h          | manga18h.xyz              | Madara        |
| MANGA18X         | Manga18x          | manga18x.net              | Madara        |
| MANGA1K          | Manga1k           | manga1k.com               | Madara        |
| MANGABEE         | MangaBee          | mangazin.org              | Madara        |
| MANGADASS        | MangaDass         | mangadass.com             | Madara        |
| MANGA_DISTRICT   | MangaDistrict     | mangadistrict.com         | Madara        |
| MANGADNA         | MangaDna          | mangadna.com              | Madara        |
| MANGAFORFREE     | MangaForFree      | mangaforfree.com          | Madara        |
| MANGAHENTAI      | MangaHentai       | mangahentai.me            | Madara        |
| MANGAHALL        | MangaHolic        | mangaholic.org            | Madara        |
| MANGAMANIACS     | MangaManiacs      | mangamaniacs.org          | Madara        |
| MANGAOWL_ONE     | MangaOwl.one      | mangaowl.one              | Madara        |
| MANGAOWL_US      | MangaOwlYaoi      | mangaowlyaoi.com          | Madara        |
| MANGARYU         | MangaRyu          | mangaryu.com              | Madara        |
| MANHUASCANUS     | ManhuaScan.Us     | manhuascan.us             | MangaReader   |
| MANHWA18APP      | Manhwa18.app      | manhwa18.app              | Madara        |
| MANHWA18COM      | Manhwa18.com      | manhwa18.com              | — (одиночный) |
| MANHWA18         | Manhwa18.net      | manhwa18.net              | — (одиночный) |
| MANHWA18ORG      | Manhwa18.org      | manhwa18.org              | Madara        |
| MANHWA68         | Manhwa68          | manhwa68.com              | Madara        |
| MANHWADEN        | ManhwaDen         | www.manhwaden.com         | Madara        |
| MANHWAHENTAI     | ManhwaHentai      | manhwahentai.me           | Madara        |
| MANHWAHENTAITO   | ManhwaHentai.to   | manhwahentai.to           | Madara        |
| MANHWALOVER      | ManhwaLover       | www.manhwalover.com       | MangaReader   |
| MANHWARAW_COM    | ManhwaRaw.com     | manhwaraw.com             | Madara        |
| MANHWATOON       | ManhwaToon        | www.manhwatoon.com        | Madara        |
| MANHWAX          | ManhwaX           | manhwax.org               | MangaReader   |
| MANHWASMEN       | ManhwasMen        | manhwas.men               | — (одиночный) |
| MANYCOMIC        | ManyComic         | manycomic.com             | Madara        |
| MANYTOON         | ManyToon          | manytoon.org              | Madara        |
| MANYTOONME       | ManyToon.me       | manytoon.me               | Madara        |
| MILFTOON         | MilfToon          | milftoon.xxx              | Madara        |
| NOVELCROW        | NovelCrow         | novelcrow.com             | Madara        |
| OMEGASCANS       | OmegaScans        | omegascans.org            | HeanCms       |
| PARITEHABER      | Paritehaber       | www.paritehaber.com       | Madara        |
| PAWMANGA         | PawManga          | pawmanga.com              | Madara        |
| PETROTECHSOCIETY | Petrotech Society | www.petrotechsociety.org  | Madara        |
| PONYMANGA        | PonyManga         | ponymanga.com             | Madara        |
| PORNCOMIXONLINE  | PornComix.online  | porncomix.online          | Madara        |
| PURURIN          | Pururin           | pururin.to                | — (одиночный) |
| SUMMANGA         | SumManga          | summanga.com              | Madara        |
| THEBLANK         | TheBlank          | theblank.net              | — (одиночный) |
| TOONGOD          | ToonGod           | www.toongod.org           | Madara        |
| TOONITUBE        | TooniTube         | toonitube.com             | MadTheme      |
| TOONILY_ME       | Toonily.Me        | toonily.me                | MadTheme      |
| TOONIZY          | Toonizy           | toonizy.com               | Madara        |
| WEBTOONXYZ       | Webtoon.xyz       | www.webtoon.xyz           | Madara        |
| WEBTOONSCAN      | WebtoonScan       | webtoonscan.com           | Madara        |
| YAOIMOBI         | Yaoi.Mobi         | yaoi.mobi                 | Madara        |
| YAOIHUB          | YaoiHub           | yaoihub.com               | Madara        |
| YAOIMANGAONLINE  | YaoiMangaOnline   | yaoimangaonline.com       | — (одиночный) |
| YAOISCAN         | YaoiScan          | yaoiscan.com              | Madara        |
| ZINCHANMANGA     | ZinChanManga.Com  | zinchangmanga.net         | Madara        |

## Русские — 1

| id        | название  | домен        | движок |
| --------- | --------- | ------------ | ------ |
| MANGAZAVR | Mangazavr | mangazavr.ru | Madara |

Единственный RU-источник форка, отсутствующий в каталоге. На движке Madara — если Madara уже
портирован под другой источник, добавление сводится к конфигу домена.

## Японские — 0

Нативных источников с raw/непереведённым японским контентом в форке нет: `lang` ни у одного
`ContentType.HENTAI`-парсера не выставлен в `ja`. Ближайший практический эквивалент —
универсальные doujin-агрегаторы из таблицы выше (ExHentai, NHentai\*, Hitomi.La, Schale.network,
ImHentai и др.), которые фактически хостят японский raw- и переводной контент, но помечены в
форке как языконезависимые (`-`).

## Корейские — 1

| id     | название | домен      | движок |
| ------ | -------- | ---------- | ------ |
| RAWDEX | RawDex   | rawdex.net | Madara |

## Китайские — 1

| id       | название | домен        | движок  |
| -------- | -------- | ------------ | ------- |
| HANMAN18 | Hanman18 | hanman18.com | Manga18 |

## Вывод

Реально релевантны для аудитории tanuki — **Mangazavr** (ru) и, возможно, пара универсальных
агрегаторов (ExHentai/NHentai/HitomiLa/ImHentai/HentaiFox). En/ko/zh-источники (94 штуки) —
низкий приоритет для русскоязычного проекта, но технически ближе всего интегрировать за счёт
переиспользования уже существующих движков в форке (Madara — самый частый, GalleryAdults для
universal-агрегаторов).
