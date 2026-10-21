import {
  ClockCounterClockwiseIcon,
  FireIcon,
  SparkleIcon,
  TrendUpIcon,
  TrophyIcon,
} from '@phosphor-icons/react';
import {
  HOME_SECTION_KIND,
  type HomeSectionInfo,
  type HomeSectionKind,
  type HomeSectionVariant,
  type SelectionsSectionResponse,
  type Title,
} from '@tanuki/contracts';

/** Иконка вкладки по смыслу блока: названия у сайтов свои, вид — общий. */
export const getHomeSectionKindIcon = (kind: HomeSectionKind, size = 16) => {
  switch (kind) {
    case HOME_SECTION_KIND.NEW:
      return <SparkleIcon size={size} />;
    case HOME_SECTION_KIND.TRENDING:
      return <TrendUpIcon size={size} />;
    case HOME_SECTION_KIND.POPULAR:
      return <FireIcon size={size} />;
    case HOME_SECTION_KIND.TOP:
      return <TrophyIcon size={size} />;
    case HOME_SECTION_KIND.UPDATES:
      return <ClockCounterClockwiseIcon size={size} />;
  }
};

/** Вариант открытого блока: из адреса, если он у блока есть, иначе первый; без вариантов — нет. */
export const resolveSectionVariant = (
  section: HomeSectionInfo,
  requestedId: string | null,
): HomeSectionVariant | undefined =>
  section.variants.find(({ id }) => id === requestedId) ?? section.variants[0];

/** Открытый блок: из адреса, если он среди показываемых, иначе первый. */
export const resolveSelectionsSection = (
  sections: HomeSectionInfo[],
  requestedId: string | null,
): HomeSectionInfo | undefined => sections.find(({ id }) => id === requestedId) ?? sections[0];

/** Тайтлы всех загруженных порций блока. Сайт мог сдвинуть блок между порциями — тайтл на стыке
 *  пришёл бы дважды. */
export const getSectionTitles = (pages: SelectionsSectionResponse[]): Title[] => [
  ...new Map(pages.flatMap(({ items }) => items).map((title) => [title.id, title])).values(),
];
