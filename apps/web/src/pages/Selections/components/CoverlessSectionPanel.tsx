import { Select, SimpleGrid } from '@mantine/core';
import { CalendarBlankIcon, SortDescendingIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { HomeSectionInfo, SortOrder } from '@tanuki/contracts';
import { getSortOrderLabel } from '@/entities/source/sortOrder';

type Props = {
  section: HomeSectionInfo;
  variant: string;
  order?: SortOrder;
  onVariantChange: (variant: string) => void;
  onOrderChange: (order: SortOrder) => void;
};

function CoverlessSectionPanel({ section, variant, order, onVariantChange, onOrderChange }: Props) {
  const { t } = useTranslation();
  return (
    <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm" maw={{ base: undefined, xs: 400 }}>
      <Select
        aria-label={t('month')}
        data={section.variants.map(({ id, title }) => ({ value: id, label: title }))}
        value={variant}
        allowDeselect={false}
        leftSection={<CalendarBlankIcon />}
        onChange={(value) => {
          if (value) onVariantChange(value);
        }}
      />
      <Select
        aria-label={t('sort')}
        data={section.sortOrders.map((value) => ({
          value,
          label: getSortOrderLabel(value, t, true),
        }))}
        value={order ?? null}
        allowDeselect={false}
        leftSection={<SortDescendingIcon />}
        onChange={(value) => {
          const next = section.sortOrders.find((item) => item === value);
          if (next) onOrderChange(next);
        }}
      />
    </SimpleGrid>
  );
}

export default CoverlessSectionPanel;
