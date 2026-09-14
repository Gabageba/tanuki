import type { GroupProps } from '@mantine/core';
import { Text } from '@mantine/core';
import type { ReactNode } from 'react';
import type { FilterSelection } from '@tanuki/contracts';
import { countGroupSelections } from '../../utils/filterSelection';
import MidDotGroup from '@/shared/ui/MidDotGroup';

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
    <MidDotGroup
      mt={mt}
      separatorProps={{ c: 'terracotta' }}
      items={[
        !!included && (
          <Text key="included" fz={12} c="terracotta">
            {`${included} выбрано`}
          </Text>
        ),
        !!excluded && (
          <Text key="excluded" fz={12} c="red">
            {`${excluded} исключено`}
          </Text>
        ),
      ]}
    />
  );
}

export default SelectedCatalogFiltersCount;
