import { Box, EmptyState, Group, Stack } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SEARCH_GROUP_STATUS, type Source, type UserSettings } from '@tanuki/contracts';
import useTitleBookmarkFolders from '@/entities/bookmark/hooks/useTitleBookmarkFolders';
import SourceTitle from '@/entities/source/components/SourceTitle';
import useSelections from '@/features/selections/hooks/useSelections';
import { getEnabledSections, getSkippedSelectionsStatus } from '@/features/selections/lib';
import CatalogLink from './CatalogLink';
import SectionRibbon from './SectionRibbon';
import SelectionsSourceSkeleton from './SelectionsSourceSkeleton';
import SourceMissedState from './SourceMissedState';

type Props = {
  source: Source;
  settings: UserSettings | undefined;
};

/**
 * Выбранный источник: заголовок с «Каталог: …» и его блоки лентами в порядке сайта (K1 + L4).
 * Выключенные в настройках и пришедшие пустыми блоки не рисуются. Закрытый и нездоровый источник
 * не запрашивается — причина видна сразу.
 */
function SelectionsSource({ source, settings }: Props) {
  const { t } = useTranslation();
  const skipped = getSkippedSelectionsStatus(source);
  const { data, isPending, isFetching, refetch } = useSelections(source.id, !skipped);
  const enabledSections = getEnabledSections(source, settings);
  const sections = (data?.sections ?? []).filter(
    ({ id, items }) => items.length > 0 && enabledSections.some((section) => section.id === id),
  );
  const getBookmarkFolder = useTitleBookmarkFolders(
    sections.flatMap(({ items }) => items.map(({ id }) => id)),
  );
  const status = skipped ?? data?.status;

  if (status && status !== SEARCH_GROUP_STATUS.OK) {
    return (
      <SourceMissedState
        source={source}
        status={status}
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  if (isPending) {
    return <SelectionsSourceSkeleton sections={enabledSections} />;
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Box miw={0}>
          <SourceTitle source={source} />
        </Box>
        <CatalogLink source={source} />
      </Group>
      {sections.length > 0 ? (
        <Stack gap="lg">
          {sections.map((section) => (
            <SectionRibbon
              key={section.id}
              section={section}
              getBookmarkFolder={getBookmarkFolder}
            />
          ))}
        </Stack>
      ) : (
        <EmptyState icon={<SparkleIcon />} title={t('sourceHasNoSelectionsNow')} />
      )}
    </Stack>
  );
}

export default SelectionsSource;
