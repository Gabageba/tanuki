import { Flex, Radio, Text } from '@mantine/core';
import styles from './CatalogFilter.module.scss';

type Props = {
  id: string;
  label: string;
};

function RangeFilterPresetCard({ id, label }: Props) {
  return (
    <Radio.Card value={id} p="xs" className={styles.radioCard}>
      <Flex gap="xs" align="center">
        <Radio.Indicator variant="outline" size="xs" />
        <Text>{label}</Text>
      </Flex>
    </Radio.Card>
  );
}

export default RangeFilterPresetCard;
