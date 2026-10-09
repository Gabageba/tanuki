import { ActionIcon, Flex, Group, Title } from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Dispatch, SetStateAction } from 'react';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import SelectedFiltersCount from '../SelectedFiltersCount';

type Props = {
  draft: FilterSelection[];
  activeGroup?: FilterGroup;
  setActiveGroupId: Dispatch<SetStateAction<string | null>>;
};

function FilterDrawerTitle({ activeGroup, setActiveGroupId, draft }: Props) {
  const { t } = useTranslation();

  return (
    <Group gap={4}>
      {activeGroup?.id && (
        <ActionIcon variant="subtle" color="gray" onClick={() => setActiveGroupId(null)}>
          <CaretLeftIcon />
        </ActionIcon>
      )}
      <Flex direction={{ base: 'column', xxs: 'row' }} columnGap="md">
        <Title order={5}>{activeGroup?.id ? activeGroup.title : t('allFilters')}</Title>
        {activeGroup?.id !== undefined && (
          <SelectedFiltersCount groupId={activeGroup.id} draft={draft} mt={{ base: 0, xxs: 2 }} />
        )}
      </Flex>
    </Group>
  );
}

export default FilterDrawerTitle;
