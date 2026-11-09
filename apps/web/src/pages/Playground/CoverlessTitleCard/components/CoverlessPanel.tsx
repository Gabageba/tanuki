import { Select, SimpleGrid } from '@mantine/core';
import { CalendarBlankIcon, SortDescendingIcon } from '@phosphor-icons/react';
import { SORT_ORDER } from '@tanuki/contracts';
import { MONTHS } from '../mocks';
import { PANEL_LAYOUT, type PanelLayout, type PopularOrder } from '../models';

type Props = {
  phone: boolean;
  layout: PanelLayout;
  month: string;
  order: PopularOrder;
  onMonthChange: (value: string) => void;
  onOrderChange: (value: PopularOrder) => void;
};

function CoverlessPanel({ phone, layout, month, order, onMonthChange, onOrderChange }: Props) {
  const getColumns = () => {
    switch (layout) {
      case PANEL_LAYOUT.ROW:
        return 2;
      case PANEL_LAYOUT.STACKED:
        return phone ? 1 : 2;
    }
  };

  return (
    <SimpleGrid cols={getColumns()} spacing="sm" maw={phone ? undefined : 400}>
      <Select
        aria-label="Месяц"
        data={MONTHS}
        value={month}
        allowDeselect={false}
        leftSection={<CalendarBlankIcon />}
        onChange={(value) => {
          if (value) onMonthChange(value);
        }}
      />
      <Select
        aria-label="Сортировка"
        value={order}
        allowDeselect={false}
        leftSection={<SortDescendingIcon />}
        data={[
          { value: SORT_ORDER.LIKES, label: 'По лайкам' },
          { value: SORT_ORDER.VIEWS, label: 'По просмотрам' },
        ]}
        onChange={(value) => {
          switch (value) {
            case SORT_ORDER.LIKES:
            case SORT_ORDER.VIEWS:
              onOrderChange(value);
          }
        }}
      />
    </SimpleGrid>
  );
}

export default CoverlessPanel;
