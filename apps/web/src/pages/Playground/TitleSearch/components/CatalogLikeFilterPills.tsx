import { Button, Group, Pill, Text } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import { countFilters, SEARCH_FILTER_GROUPS } from '../lib';
import { EMPTY_FILTERS, type SearchFilters } from '../models';
import styles from '../TitleSearch.module.scss';

type Props = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
};

/** F6 — копия `CatalogFilterPills`: пилюля на группу в рамке акцента, первое значение и «+N»,
 *  в конце «Сбросить». */
function CatalogLikeFilterPills({ filters, onChange }: Props) {
  if (!countFilters(filters)) {
    return null;
  }

  return (
    <Group gap="xs">
      {SEARCH_FILTER_GROUPS.map((group) => {
        const selected = group.options.filter(({ value }) =>
          (filters[group.key] as string[]).includes(value),
        );
        const first = selected[0];

        return (
          first && (
            <Pill
              key={group.key}
              className={styles.catalogPill}
              size="md"
              withRemoveButton
              onRemove={() => onChange({ ...filters, [group.key]: [] })}
              styles={{ label: { display: 'flex', alignItems: 'center' } }}
            >
              <Text fz={14}>{group.title}:</Text>
              <Text fz={14} ml={4}>
                {first.label}
              </Text>
              <OtherItemsTag count={selected.length - 1} />
            </Pill>
          )
        );
      })}
      <Button
        variant="subtle"
        color="gray"
        leftSection={<ArrowCounterClockwiseIcon />}
        onClick={() => onChange(EMPTY_FILTERS)}
      >
        Сбросить
      </Button>
    </Group>
  );
}

export default CatalogLikeFilterPills;
