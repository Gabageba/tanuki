import { Badge, Group, Stack, Text, Title } from '@mantine/core';

type Props = {
  letter: string;
  title: string;
  description: string;
};

/** Заголовок оси: буква для якоря, название и вопрос, на который она отвечает. */
function AxisHeading({ letter, title, description }: Props) {
  return (
    <Stack gap={4} id={`axis-${letter}`} maw={760}>
      <Group gap="xs">
        <Badge variant="outline" ff="monospace">
          {letter}
        </Badge>
        <Title order={3}>{title}</Title>
      </Group>
      <Text c="dimmed" fz="sm">
        {description}
      </Text>
    </Stack>
  );
}

export default AxisHeading;
