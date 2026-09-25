import { Badge, Card, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { PLAYGROUND_TASKS } from './models';

/** Песочница: список задач, по каждой — страница с макетами вариантов интерфейса. Только DEV. */
function Playground() {
  const { formatDate } = useDateFormat();

  return (
    <Container py="md" size="xl">
      <Title order={2} mb="md">
        Песочница
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {PLAYGROUND_TASKS.map((task) => (
          <Card key={task.path} component={Link} to={task.path} withBorder>
            <Stack gap={6}>
              <Group justify="space-between" wrap="nowrap">
                <Text fw={600}>{task.title}</Text>
                <ArrowRightIcon />
              </Group>
              <Text fz="sm" c="dimmed">
                {task.description}
              </Text>
              <Group justify="space-between" wrap="nowrap">
                <Text fz={12} c="dimmed">
                  {formatDate(task.createdAt)}
                </Text>
                {task.decision && (
                  <Badge variant="light" tt="none" ff="monospace">
                    {task.decision}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}

export default Playground;
