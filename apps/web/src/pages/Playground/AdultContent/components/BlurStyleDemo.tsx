import { Box, Group, Paper, SimpleGrid } from '@mantine/core';
import { EXAMPLE_TITLES } from '../mocks';
import type { BlurStyle } from '../models';
import MockGridCard from './MockGridCard';
import MockListCard from './MockListCard';

type Props = {
  blurStyle: BlurStyle;
};

/** Одна и та же размытая обложка в сетке каталога и в списке. */
function BlurStyleDemo({ blurStyle }: Props) {
  return (
    <Group align="flex-start" gap="xl" mt="xs">
      <SimpleGrid cols={3} spacing="sm" w={480} maw="100%">
        {EXAMPLE_TITLES.map((title) => (
          <MockGridCard
            key={title.id}
            title={title}
            blurred={title.isAdult}
            blurStyle={blurStyle}
          />
        ))}
      </SimpleGrid>
      <Box w={340} maw="100%">
        <Paper withBorder radius="md">
          {EXAMPLE_TITLES.map((title) => (
            <MockListCard
              key={title.id}
              title={title}
              blurred={title.isAdult}
              blurStyle={blurStyle}
            />
          ))}
        </Paper>
      </Box>
    </Group>
  );
}

export default BlurStyleDemo;
