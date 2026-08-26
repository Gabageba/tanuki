import { NavLink, ScrollArea, Stack } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { Dispatch, SetStateAction } from 'react';
import type { FilterGroup } from '@tanuki/contracts';
import type { FilterSelection } from '../../../../../../../../packages/contracts/dist/cjs';
import CatalogFilterGroupTitle from '../CatalogFilterGroupTitle';
import SelectedCatalogFiltersCount from '../SelectedCatalogFiltersCount';

type Props = {
  groups: FilterGroup[];
  draft: FilterSelection[];
  setActiveGroupId: Dispatch<SetStateAction<string | null>>;
};

function CatalogFilterDrawerGroups({ groups, draft, setActiveGroupId }: Props) {
  return (
    <ScrollArea type="auto" offsetScrollbars="y" flex={1} mih={0}>
      <Stack gap={0} flex={1}>
        {groups.map((group) => {
          return (
            <NavLink
              key={group.id}
              label={<CatalogFilterGroupTitle group={group} />}
              description={
                <SelectedCatalogFiltersCount groupId={group.id} draft={draft} renderEmpty="Любой" />
              }
              rightSection={<CaretRightIcon />}
              onClick={() => setActiveGroupId(group.id)}
            />
          );
        })}
      </Stack>
    </ScrollArea>
  );
}

export default CatalogFilterDrawerGroups;
