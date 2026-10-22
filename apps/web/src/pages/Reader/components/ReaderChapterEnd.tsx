import { Button, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CloudSlashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ReaderNextChapterButton from './ReaderNextChapterButton';

type Props = {
  titleId: string;
  nextChapterId: string | null;
  /** Без сети, и следующая глава не скачана: вместо перехода — «Открыть загрузки» (U1). */
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
        <Button
          component={Link}
          to={ROUTE_PATHS.DOWNLOADS}
          variant="default"
          size="xs"
          leftSection={<TrayArrowDownIcon />}
        >
          {t('openDownloads')}
        </Button>
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
