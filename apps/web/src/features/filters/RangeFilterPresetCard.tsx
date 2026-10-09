import { Flex, Radio, Text } from '@mantine/core';

type Props = {
  id: string;
  label: string;
};

function RangeFilterPresetCard({ id, label }: Props) {
  return (
    <Radio.Card value={id} variant="tile" px="xs" py={6}>
      <Flex gap="xs" align="center">
        <Radio.Indicator variant="outline" size="xs" />
        <Text>{label}</Text>
      </Flex>
    </Radio.Card>
  );
}

export default RangeFilterPresetCard;
