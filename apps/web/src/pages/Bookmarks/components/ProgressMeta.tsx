import { Text } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import type { BookmarkItem } from '@tanuki/contracts';
import NumericMeta from '@/entities/title/NumericMeta';

type Props = {
  bookmark: Pick<BookmarkItem, 'progress' | 'chaptersCount'>;
};

const MONO = { mono: <Text span inherit ff="monospace" /> };

/** «Гл. 1090 из 1093» — фраза Golos Text с моноширинными номерами, неразрывная. Ветку отметки ещё
 *  не проверяли — только «Гл. 1090». Без отметки — число глав, тайтл ещё не проверяли — ничего. */
function ProgressMeta({ bookmark }: Props) {
  const { t } = useTranslation();
  const { progress, chaptersCount } = bookmark;

  if (progress && progress.chapterNumber !== null) {
    if (progress.total === null) {
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
          values={{ number: progress.chapterNumber, total: progress.total }}
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
