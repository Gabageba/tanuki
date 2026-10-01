import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import ReaderNextChapterButton from './ReaderNextChapterButton';

type Props = {
  titleId: string;
  nextChapterId: string | null;
};

/** Экран конца главы — при выключенной настройке «Сразу открывать следующую главу». */
function ReaderChapterEnd({ titleId, nextChapterId }: Props) {
  const { t } = useTranslation();

  if (!nextChapterId) return <Text c="dimmed">{t('thisIsLastChapter')}</Text>;

  return (
    <Stack gap="sm" align="center">
      <Text c="dimmed">{t('endOfChapter')}</Text>
      <ReaderNextChapterButton titleId={titleId} chapterId={nextChapterId} />
    </Stack>
  );
}

export default ReaderChapterEnd;
