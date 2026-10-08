import { Text, type MantineStyleProps } from '@mantine/core';

type Props = {
  count: number;
  /** Что писать, когда ничего не выбрано; без него — ничего. */
  empty?: string;
  mt?: MantineStyleProps['mt'];
};

/** «N выбрано» цветом акцента — копия `SelectedCatalogFiltersCount` без исключений: в поиске
 *  исключать нечего. */
function CatalogSelectedCount({ count, empty, mt }: Props) {
  if (!count) {
    return empty ?? null;
  }

  return (
    <Text fz={12} c="terracotta" mt={mt}>
      {count} выбрано
    </Text>
  );
}

export default CatalogSelectedCount;
