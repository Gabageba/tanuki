import type { GroupProps } from '@mantine/core';
import { Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import type { FilterSelection } from '@tanuki/contracts';
import { countGroupSelections } from '../../utils/filterSelection';
import MidDot from '@/shared/ui/MidDot';

type Props = {
  groupId: string;
  draft: FilterSelection[];
  renderEmpty?: ReactNode;
  mt?: GroupProps['mt'];
};

function SelectedCatalogFiltersCount({ groupId, draft, renderEmpty, mt }: Props) {
  const { excluded, included } = countGroupSelections(draft, groupId);

  if (!excluded && !included) {
    return renderEmpty ?? null;
  }

  return (
    <Group gap={4} mt={mt}>
      <Text fz={12} c="terracotta">
        {included ? `${included} выбрано` : ''}
      </Text>
      <Text fz={12} c="terracotta">
        {included && excluded ? <MidDot /> : ''}
      </Text>
      <Text fz={12} c="red">
        {excluded ? `${excluded} исключено` : ''}
      </Text>
    </Group>
  );
}

export default SelectedCatalogFiltersCount;
