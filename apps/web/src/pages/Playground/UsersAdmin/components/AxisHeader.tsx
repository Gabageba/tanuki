import { Stack, Text, Title } from '@mantine/core';

type Props = {
  title: string;
  description: string;
};

function AxisHeader({ title, description }: Props) {
  return (
    <Stack gap={4}>
      <Title order={3}>{title}</Title>
      <Text fz="sm" c="dimmed" maw={760}>
        {description}
      </Text>
    </Stack>
  );
}

export default AxisHeader;
