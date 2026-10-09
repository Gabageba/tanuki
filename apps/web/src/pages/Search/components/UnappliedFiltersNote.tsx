import { Group, Text } from '@mantine/core';
import { FunnelXIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { SearchFilterGroup } from '@tanuki/contracts';
import { getSearchFilterGroupTitle } from '../lib';

type Props = {
  filters: SearchFilterGroup[];
};

/** Под названием источника: какие из выбранных фильтров он не применил и выдача не сужена. */
function UnappliedFiltersNote({ filters }: Props) {
  const { t } = useTranslation();

  if (filters.length === 0) {
    return null;
  }

  return (
    <Group gap={6} wrap="nowrap" c="dimmed">
      <FunnelXIcon />
      <Text fz="xs">
        {t('notApplied', {
          filters: filters
            .map((group) => getSearchFilterGroupTitle(group, t).toLowerCase())
            .join(', '),
        })}
      </Text>
    </Group>
  );
}

export default UnappliedFiltersNote;
