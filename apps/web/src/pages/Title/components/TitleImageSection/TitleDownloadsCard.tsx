import { Button, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { TrayArrowDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import useIsDownloadsPaused from '@/entities/download/hooks/useIsDownloadsPaused';
import useTitleDownloads from '@/entities/download/hooks/useTitleDownloads';
import { formatSize } from '@/shared/lib/formatSize';
import { getTitleDownloadsPath, getTitleDownloadsPhrase, getTitleDownloadsSummary } from './lib';
import { TITLE_DOWNLOADS_STATE } from './models';
import TitleDownloadsStateIcon from './TitleDownloadsStateIcon';

type Props = {
  titleId: string;
};

/** Карточка загрузок тайтла (B3): что скачано, прогресс и вход в «Загрузки». Ничего не скачано и
 *  не в очереди — карточки нет. */
function TitleDownloadsCard({ titleId }: Props) {
  const { t, i18n } = useTranslation();
  const downloads = useTitleDownloads(titleId);
  const isPaused = useIsDownloadsPaused();
  const summary = downloads && getTitleDownloadsSummary([...downloads.values()], isPaused);

  if (!summary) return null;

  const { state } = summary;
  const isActive =
    state === TITLE_DOWNLOADS_STATE.DOWNLOADING || state === TITLE_DOWNLOADS_STATE.PAUSED;

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <TitleDownloadsStateIcon state={state} progress={summary.progress} />
          <Stack gap={0} flex={1} miw={0}>
            <Text fz="sm" c={state === TITLE_DOWNLOADS_STATE.FAILED ? 'red' : undefined}>
              {getTitleDownloadsPhrase(summary, t)}
            </Text>
            <Text fz="xs" c="dimmed" ff="monospace">
              {formatSize(summary.bytes, t, i18n.language)}
            </Text>
          </Stack>
        </Group>
        {isActive && (
          <Progress
            size="sm"
            value={summary.progress}
            color={state === TITLE_DOWNLOADS_STATE.PAUSED ? 'gray' : undefined}
          />
        )}
        <Button
          component={Link}
          to={getTitleDownloadsPath(state, titleId)}
          variant="default"
          size="xs"
          fullWidth
          leftSection={<TrayArrowDownIcon />}
        >
          {t('openDownloads')}
        </Button>
      </Stack>
    </Paper>
  );
}

export default TitleDownloadsCard;
