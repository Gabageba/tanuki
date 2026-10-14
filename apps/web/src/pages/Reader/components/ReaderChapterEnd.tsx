import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CloudSlashIcon } from '@phosphor-icons/react';
import ReaderNextChapterButton from './ReaderNextChapterButton';

type Props = {
  titleId: string;
  nextChapterId: string | null;
  /** Без сети, и следующая глава не скачана: перехода нет (U1). Кнопка «Открыть загрузки» появится
   *  вместе со страницей `/downloads`. */
  isNextUnavailable?: boolean;
};

/** Экран конца главы — при выключенной настройке «Сразу открывать следующую главу» и без сети,
 *  когда следующая глава не скачана. */
function ReaderChapterEnd({ titleId, nextChapterId, isNextUnavailable = false }: Props) {
  const { t } = useTranslation();

  if (!nextChapterId) return <Text c="dimmed">{t('thisIsLastChapter')}</Text>;

  if (isNextUnavailable) {
    return (
      <Stack gap="sm" align="center" c="dimmed">
        <Text c="dimmed">{t('endOfChapter')}</Text>
        <CloudSlashIcon size={24} />
        <Text fz="sm" ta="center">
          {t('nextChapterNotDownloaded')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" align="center">
      <Text c="dimmed">{t('endOfChapter')}</Text>
      <ReaderNextChapterButton titleId={titleId} chapterId={nextChapterId} />
    </Stack>
  );
}

export default ReaderChapterEnd;
