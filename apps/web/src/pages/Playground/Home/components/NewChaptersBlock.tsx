import { useContext } from 'react';
import { AspectRatio, Box, Group, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import CoverImage from '@/shared/ui/CoverImage';
import { catalogEntryFor } from '@tanuki/contracts';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { MOCK_NEW_CHAPTERS } from '../mocks';
import CardsRow from './CardsRow';
import HomeBlockHeading from './HomeBlockHeading';
import MarkedTitleCard from './MarkedTitleCard';

type Props = {
  /** W2, W3 — списком строк в две колонки вместо ленты обложек. */
  asList?: boolean;
};

/** «Новые главы в закладках» — тайтлы из закладок, где вышли главы. Ведёт в закладки. Нет новых —
 *  блока нет. */
function NewChaptersBlock({ asList = false }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  if (MOCK_NEW_CHAPTERS.length === 0) {
    return null;
  }

  return (
    <Stack gap="sm">
      <HomeBlockHeading
        title="Новые главы в закладках"
        link={{ label: 'Все закладки', to: ROUTE_PATHS.BOOKMARKS }}
      />
      {asList ? (
        <SimpleGrid cols={isPhone ? 1 : 2} spacing="md" verticalSpacing="xs">
          {MOCK_NEW_CHAPTERS.map(({ title, newCount }) => (
            <UnstyledButton
              key={title.id}
              component={Link}
              to={generatePath(ROUTE_PATHS.TITLE, { titleId: title.id })}
            >
              <Group gap="sm" wrap="nowrap">
                <Box w={40} flex="none">
                  <AspectRatio ratio={3 / 4}>
                    <Box bdrs="sm" style={{ overflow: 'hidden' }}>
                      <CoverImage src={title.coverUrl} alt={title.name} />
                    </Box>
                  </AspectRatio>
                </Box>
                <Stack gap={2} miw={0} flex={1}>
                  <Text fz="sm" lh="tight" truncate>
                    {title.name}
                  </Text>
                  <Group gap={6} wrap="nowrap">
                    <SourceIcon
                      id={title.sourceId}
                      title={catalogEntryFor(title.sourceId).title}
                      size={14}
                    />
                    <Text fz="xs" c="dimmed" truncate>
                      {catalogEntryFor(title.sourceId).title}
                    </Text>
                  </Group>
                </Stack>
                <Text
                  fz="sm"
                  fw={600}
                  ff="monospace"
                  c="var(--mantine-primary-color-filled)"
                  flex="none"
                >
                  +{newCount}&nbsp;гл.
                </Text>
              </Group>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      ) : (
        <CardsRow
          items={MOCK_NEW_CHAPTERS.map(({ title, newCount }) => ({
            key: title.id,
            node: <MarkedTitleCard title={title} badge={`+${newCount}`} />,
          }))}
        />
      )}
    </Stack>
  );
}

export default NewChaptersBlock;
