import { Group, Radio, Stack, Text } from '@mantine/core';

type Props = {
  value: string;
  title: string;
  description: string;
};

/** Ответ на вопрос о конфликте — `Radio.Card` строкой, как выбор папки и темы. */
function PolicyCard({ value, title, description }: Props) {
  return (
    <Radio.Card value={value} variant="tile" radius="md" p="sm">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Radio.Indicator variant="outline" mt={2} />
        <Stack gap={2} miw={0}>
          <Text fz="sm" lh="tight">
            {title}
          </Text>
          <Text fz={12} c="dimmed" lh="tight">
            {description}
          </Text>
        </Stack>
      </Group>
    </Radio.Card>
  );
}

export default PolicyCard;
