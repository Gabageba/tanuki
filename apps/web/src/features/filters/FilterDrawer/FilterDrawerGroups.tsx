import { NavLink, ScrollArea, Stack } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Dispatch, SetStateAction } from 'react';
import type { FilterGroup } from '@tanuki/contracts';
import type { FilterSelection } from '@tanuki/contracts';
import FilterGroupTitle from '../FilterGroupTitle';
import SelectedFiltersCount from '../SelectedFiltersCount';

type Props = {
  groups: FilterGroup[];
  draft: FilterSelection[];
  setActiveGroupId: Dispatch<SetStateAction<string | null>>;
};

function FilterDrawerGroups({ groups, draft, setActiveGroupId }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollArea type="auto" scrollbars="y" offsetScrollbars="present" flex={1} mih={0}>
      <Stack gap={0} flex={1}>
        {groups.map((group) => {
          return (
            <NavLink
              key={group.id}
              label={<FilterGroupTitle group={group} />}
              description={
                <SelectedFiltersCount group={group} draft={draft} renderEmpty={t('any')} />
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

export default FilterDrawerGroups;
