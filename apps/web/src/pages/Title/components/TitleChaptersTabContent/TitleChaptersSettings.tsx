import { Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { DownloadSimpleIcon, SortAscendingIcon, SortDescendingIcon } from '@phosphor-icons/react';
import {
  SORT_DIRECTION,
  SortDirectionSchema,
  type ChaptersResponse,
  type SortDirection,
} from '@tanuki/contracts';
import type { DownloadRow } from '@/entities/download/models';
import { isDownloadSupported } from '@/entities/download/queue';
import DownloadChaptersModal from './DownloadChaptersModal';

type DownloadParams = {
  titleId: string;
  branchId: string;
  chaptersList: ChaptersResponse;
  downloads: ReadonlyMap<string, DownloadRow> | undefined;
  ownChapterId: string | undefined;
};

type Props = {
  /** Данные для «Скачать все»; без них (скелетон) кнопка видна, но неактивна. */
  download?: DownloadParams;
};

function TitleChaptersSettings({ download }: Props) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDownloadOpened, { open: openDownload, close: closeDownload }] = useDisclosure(false);

  const parsedDirection = SortDirectionSchema.safeParse(searchParams.get('direction'));
  const direction = parsedDirection.success ? parsedDirection.data : SORT_DIRECTION.DESC;

  const handleDirectionToggle = () => {
    const nextDirection: SortDirection =
      direction === SORT_DIRECTION.DESC ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('direction', nextDirection);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <Group justify="space-between" gap="sm">
      <Button
        variant="default"
        size="xs"
        leftSection={
          direction === SORT_DIRECTION.DESC ? <SortDescendingIcon /> : <SortAscendingIcon />
        }
        onClick={handleDirectionToggle}
      >
        {direction === SORT_DIRECTION.DESC ? t('newestFirst') : t('oldestFirst')}
      </Button>
      {isDownloadSupported() && (
        <Button
          size="xs"
          leftSection={<DownloadSimpleIcon />}
          disabled={!download}
          onClick={openDownload}
        >
          {t('downloadAll')}
        </Button>
      )}
      {download && (
        <DownloadChaptersModal opened={isDownloadOpened} onClose={closeDownload} {...download} />
      )}
    </Group>
  );
}

export default TitleChaptersSettings;
