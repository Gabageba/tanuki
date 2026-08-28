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
      {!!included && (
        <Text fz={12} c="terracotta">
          {`${included} выбрано`}
        </Text>
      )}
      {!!included && !!excluded && (
        <Text fz={12} c="terracotta">
          <MidDot />
        </Text>
      )}
      {!!excluded && (
        <Text fz={12} c="red">
          {`${excluded} исключено`}
        </Text>
      )}
    </Group>
  );
}

export default SelectedCatalogFiltersCount;
