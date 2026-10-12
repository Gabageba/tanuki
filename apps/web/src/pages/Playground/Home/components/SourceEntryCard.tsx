import { AspectRatio, Box, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { CaretRightIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import CoverImage from '@/shared/ui/CoverImage';
import { formatSelectionsCount } from '../lib';
import type { HomeSource } from '../models';

type Props = {
  home: HomeSource;
  /** Куда ведёт карточка: страница подборок (P4a) или вкладка на каталоге (P4c). */
  to: string;
};

/** Вход в подборки источника: логотип, название, сколько подборок и три обложки из первой. */
function SourceEntryCard({ home: { source, blocks }, to }: Props) {
  const covers = blocks[0]?.items.slice(0, 3) ?? [];

  return (
    <Paper component={Link} to={to} withBorder radius="md" p="sm" c="inherit" td="none">
      <Stack gap="sm">
        <Group gap="xs" wrap="nowrap" justify="space-between">
          <Group gap="xs" wrap="nowrap" miw={0}>
            <SourceIcon id={source.id} title={source.title} size={28} />
            <Stack gap={0} miw={0}>
              <Text fz="sm" fw={600} lh="tight" truncate>
                {source.title}
              </Text>
              <Text fz="xs" c="dimmed" lh="tight">
                {formatSelectionsCount(blocks.length)}
              </Text>
            </Stack>
          </Group>
          <CaretRightIcon />
        </Group>
        <SimpleGrid cols={3} spacing={6}>
          {covers.map((title) => (
            <AspectRatio key={title.id} ratio={3 / 4}>
              <Box bdrs="sm" style={{ overflow: 'hidden' }}>
                <CoverImage src={title.coverUrl} alt={title.name} />
              </Box>
            </AspectRatio>
          ))}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export default SourceEntryCard;
