import { Divider, SimpleGrid, Stack } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import {
  CARD_DENSITY,
  FEED_STATE,
  type CardOptions,
  type Example,
  type FeedState,
} from '../models';
import CoverlessCard from './CoverlessCard';
import CoverlessCardSkeleton from './CoverlessCardSkeleton';
import CoverlessEmpty from './CoverlessEmpty';
import SelectionsMissedState from './SelectionsMissedState';

type Props = CardOptions & {
  examples: Example[];
  phone: boolean;
  state?: FeedState;
  onRetry?: () => void;
};

const RETRY = () => undefined;

function CoverlessFeed({
  examples,
  phone,
  state = FEED_STATE.READY,
  onRetry = RETRY,
  columns = 1,
  density = CARD_DENSITY.SHORT,
  current = false,
  ...options
}: Props) {
  switch (state) {
    case FEED_STATE.LOADING:
      return (
        <SimpleGrid cols={phone ? 1 : columns} spacing="sm">
          {Array.from({ length: 3 }, (_, index) => (
            <CoverlessCardSkeleton key={index} density={density} />
          ))}
        </SimpleGrid>
      );
    case FEED_STATE.EMPTY:
      return <CoverlessEmpty />;
    case FEED_STATE.UNAVAILABLE:
    case FEED_STATE.LOCKED:
      return <SelectionsMissedState state={state} onRetry={onRetry} />;
    case FEED_STATE.READY:
      if (examples.length === 0) return <CoverlessEmpty />;
      return (
        <Stack gap={0}>
          <SimpleGrid cols={phone ? 1 : columns} spacing="sm" style={{ alignItems: 'start' }}>
            {examples.map((example) =>
              current ? (
                <SourceTitleCard
                  key={example.title.id}
                  title={example.title}
                  bookmarkFolder={example.folder}
                  viewMode={VIEW_MODE.LIST}
                />
              ) : (
                <CoverlessCard
                  key={example.title.id}
                  example={example}
                  density={density}
                  {...options}
                />
              ),
            )}
          </SimpleGrid>
          <Divider
            mt="lg"
            label="Сайт показывает в этом блоке только эти тайтлы"
            labelPosition="center"
          />
        </Stack>
      );
  }
}

export default CoverlessFeed;
