import { AspectRatio, Box, Group, Scroller, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import CoverImage from '@/shared/ui/CoverImage';
import { MOCK_STALE } from '../mocks';
import CardsRow from './CardsRow';
import ContinueChapter from './ContinueChapter';
import HomeBlockHeading from './HomeBlockHeading';
import MarkedTitleCard from './MarkedTitleCard';

type Props = {
  /** W2, W3 — ряд маленьких обложек без подписей, название — в тултипе. */
  asCovers?: boolean;
};

/** «Давно не открывали» — начатые тайтлы, которых не касались больше месяца. Нет таких — блока нет. */
function StaleBlock({ asCovers = false }: Props) {
  if (MOCK_STALE.length === 0) {
    return null;
  }

  return (
    <Stack gap="sm">
      <HomeBlockHeading title="Давно не открывали" />
      {asCovers ? (
        <Scroller>
          <Group gap="sm" wrap="nowrap">
            {MOCK_STALE.map((item) => (
              <Tooltip key={item.title.id} label={`${item.title.name} · ${item.readAgo}`}>
                <UnstyledButton
                  component={Link}
                  to={generatePath(ROUTE_PATHS.TITLE, { titleId: item.title.id })}
                  w={72}
                  flex="none"
                >
                  <AspectRatio ratio={3 / 4}>
                    <Box bdrs="md" style={{ overflow: 'hidden' }}>
                      <CoverImage src={item.title.coverUrl} alt={item.title.name} />
                    </Box>
                  </AspectRatio>
                </UnstyledButton>
              </Tooltip>
            ))}
          </Group>
        </Scroller>
      ) : (
        <CardsRow
          items={MOCK_STALE.map((item) => ({
            key: item.title.id,
            node: (
              <MarkedTitleCard
                title={item.title}
                meta={[<ContinueChapter key="chapter" item={item} />, item.readAgo]}
              />
            ),
          }))}
        />
      )}
    </Stack>
  );
}

export default StaleBlock;
