import type { GroupProps } from '@mantine/core';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import { countGroupSelections, isExcludableGroup } from './lib/filterSelection';
import MidDotGroup from '@/shared/ui/MidDotGroup';

type Props = {
  group: FilterGroup;
  draft: FilterSelection[];
  renderEmpty?: ReactNode;
  mt?: GroupProps['mt'];
};

function SelectedFiltersCount({ group, draft, renderEmpty, mt }: Props) {
  const { t } = useTranslation();
  const { excluded, included } = countGroupSelections(draft, group.id);

  if (!excluded && !included) {
    return renderEmpty ?? null;
  }

  return (
    <MidDotGroup
      mt={mt}
      separatorProps={{ c: 'dimmed' }}
      items={[
        !!included && (
          <Text key="included" fz={12} c={isExcludableGroup(group) ? 'green' : 'terracotta'}>
            {t('countSelected', { count: included })}
          </Text>
        ),
        !!excluded && (
          <Text key="excluded" fz={12} c="red">
            {t('countExcluded', { count: excluded })}
          </Text>
        ),
      ]}
    />
  );
}

export default SelectedFiltersCount;
