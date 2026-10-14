import { useState } from 'react';
import { Box, Divider, Group, Stack, Title } from '@mantine/core';
import SourceTitle from '@/entities/source/components/SourceTitle';
import GoBackButton from '@/shared/ui/GoBackButton';
import { MOCK_HOME_ALL, MOCK_MISSED } from '../mocks';
import { SHORT_BLOCKS } from '../models';
import CatalogButton from './CatalogButton';
import HomeBlocksStack from './HomeBlocksStack';
import HomeSourceSkeleton from './HomeSourceSkeleton';
import SourceMissNotice from './SourceMissNotice';
import SourcePickerChips from './SourcePickerChips';

/** Не ответивший источник в чипах — один, «не успел»: этого хватает показать состояние. */
const MISSED = MOCK_MISSED.slice(0, 1);

type Props = {
  /** Блоки выбранного источника ещё грузятся — Z1. */
  isLoading: boolean;
  /** С какого источника открыть: с карточки, с прошлого раза или не ответивший — для макета. */
  initialId?: string;
};

/** Итог — страница «Подборки»: «Назад» на главную, чипы источников (P3a), у выбранного — заголовок
 *  с кнопкой «Каталог …» (L4) и все его блоки лентами (K1). */
function DiscoverFinalPage({ isLoading, initialId }: Props) {
  const sources = [
    ...MOCK_HOME_ALL.map(({ source }) => source),
    ...MISSED.map(({ source }) => source),
  ];
  const [activeId, setActiveId] = useState(initialId ?? sources[0]?.id ?? '');
  const home = MOCK_HOME_ALL.find(({ source }) => source.id === activeId);
  const missed = MISSED.find(({ source }) => source.id === activeId);

  return (
    <Stack gap="lg">
      <Stack gap="md">
        <Group gap="xs" wrap="nowrap">
          <GoBackButton path="/" />
          <Title order={2}>Подборки</Title>
        </Group>
        <Divider />
      </Stack>
      <SourcePickerChips sources={sources} activeId={activeId} onChange={setActiveId} />
      {missed && <SourceMissNotice group={missed} />}
      {home && isLoading && <HomeSourceSkeleton blocks={home.blocks} />}
      {home && !isLoading && (
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Box miw={0}>
              <SourceTitle source={home.source} />
            </Box>
            <CatalogButton source={home.source} />
          </Group>
          <HomeBlocksStack blocks={home.blocks} shortBlocks={SHORT_BLOCKS.RIBBON} />
        </Stack>
      )}
    </Stack>
  );
}

export default DiscoverFinalPage;
