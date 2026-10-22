import { Group, Radio, Stack, Text } from '@mantine/core';

type Props = {
  value: string;
  title: string;
  /** Что значит выбор — серым под заголовком. */
  description: string;
};

/** Вариант в `Radio.Group` карточкой: индикатор, заголовок и пояснение. */
function RadioCardOption({ value, title, description }: Props) {
  return (
    <Radio.Card value={value} variant="tile" radius="md" p="sm">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Radio.Indicator variant="outline" mt={2} />
        <Stack gap={2} miw={0}>
          <Text fz="sm" lh="tight">
            {title}
          </Text>
          <Text fz="xs" c="dimmed" lh="tight">
            {description}
          </Text>
        </Stack>
      </Group>
    </Radio.Card>
  );
}

export default RadioCardOption;
