import { Text } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import type { BookmarkItem } from '@tanuki/contracts';
import NumericMeta from '@/entities/title/NumericMeta';

type Props = {
  bookmark: Pick<BookmarkItem, 'progress' | 'chaptersCount'>;
};

const MONO = { mono: <Text span inherit ff="monospace" /> };

/** «Гл. 197 из 203» — фраза Golos Text с моноширинными номерами, неразрывная. Первое число —
 *  порядковый номер главы в ветке (position), а не номер из названия: он сравним с общим числом глав.
 *  Ветку отметки ещё не проверяли — только «Гл. 1090» с номером главы. Без отметки — число глав, тайтл ещё не проверяли — ничего. */
function ProgressMeta({ bookmark }: Props) {
  const { t } = useTranslation();
  const { progress, chaptersCount } = bookmark;

  if (progress && progress.chapterNumber !== null) {
    if (progress.total === null || progress.position === null) {
      return (
        <Text span inherit>
          {t('chapterNumberAbbrev', { number: progress.chapterNumber })}
        </Text>
      );
    }
    return (
      <Text span inherit>
        <Trans
          i18nKey="chapterNumberOfTotalAbbrev"
          values={{ number: progress.position, total: progress.total }}
          components={MONO}
        />
      </Text>
    );
  }

  const total = progress?.total ?? chaptersCount;
  if (total) {
    return <NumericMeta>{t('countChaptersAbbrev', { count: total })}</NumericMeta>;
  }

  return null;
}

export default ProgressMeta;
