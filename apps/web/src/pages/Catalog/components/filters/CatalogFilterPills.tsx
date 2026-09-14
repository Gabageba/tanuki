import { Button, Grid, Group, Pill, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { FilterGroup } from '@tanuki/contracts';
import type { FilterSelection } from '../../../../../../../packages/contracts/dist/cjs';
import { clearGroupSelection, getGroupSelectionOptions } from '../../utils/filterSelection';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import styles from './CatalogFilter.module.scss';

type Props = {
  groups: FilterGroup[] | undefined;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
};

function CatalogFilterPills({ groups, selection, onChange }: Props) {
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
    <Grid.Col span={12} order={{ base: 2, xs: 3 }}>
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
                <Text fz={14}>{options.title}:</Text>
                <Text fz={14} ml={4} td={options.firstItem.exclude ? 'line-through' : 'none'}>
                  {options.firstItem.label}
                </Text>
                <OtherItemsTag count={options.otherItemsLength} />
              </Pill>
            )
          );
        })}
        {!!selection.length && (
          <Button variant="subtle" color="gray" onClick={() => onChange([])}>
            {t('reset')}
          </Button>
        )}
      </Group>
    </Grid.Col>
  );
}

export default CatalogFilterPills;
