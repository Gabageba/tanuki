import { Badge, Group, Stack, Text, Title } from '@mantine/core';

type Props = {
  letter: string;
  title: string;
  description: string;
};

/** Заголовок оси: буква, вопрос из плана и что смотреть. */
function AxisHeading({ letter, title, description }: Props) {
  return (
    <Stack gap={4} pt="lg" id={`axis-${letter}`}>
      <Group gap="xs">
        <Badge variant="outline" ff="monospace" size="lg">
          {letter}
        </Badge>
        <Title order={3}>{title}</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        {description}
      </Text>
    </Stack>
  );
}

export default AxisHeading;
