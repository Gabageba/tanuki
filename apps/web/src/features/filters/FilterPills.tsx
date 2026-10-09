import { Button, Group, Pill, Text } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import { clearGroupSelection, getGroupSelectionOptions } from './lib/filterSelection';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import styles from './Filter.module.scss';

type Props = {
  groups: FilterGroup[] | undefined;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
};

function FilterPills({ groups, selection, onChange }: Props) {
  const { t } = useTranslation();

  if (!groups) {
    return null;
  }

  const groupOptions = groups.map((group) => ({
    group,
    options: getGroupSelectionOptions(group, selection, t),
  }));

  if (groupOptions.every(({ options }) => !options)) {
    return null;
  }

  return (
    <Group gap="xs">
      {groupOptions.map(({ group, options }) => {
        return (
          options && (
            <Pill
              className={styles.pill}
              size="md"
              key={group.id}
              withRemoveButton
              onRemove={() => onChange(clearGroupSelection(selection, group.id))}
              styles={{
                label: {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <Text fz="sm">{options.title}:</Text>
              <Text fz="sm" ml={4} td={options.firstItem.exclude ? 'line-through' : 'none'}>
                {options.firstItem.label}
              </Text>
              <OtherItemsTag count={options.otherItemsLength} />
            </Pill>
          )
        );
      })}
      {!!selection.length && (
        <Button
          variant="subtle"
          color="gray"
          leftSection={<ArrowCounterClockwiseIcon />}
          onClick={() => onChange([])}
        >
          {t('reset')}
        </Button>
      )}
    </Group>
  );
}

export default FilterPills;
