import { Stack } from '@mantine/core';
import { MOCK_CONTINUE } from '../mocks';
import { CONTINUE_CARD } from '../models';
import ContinueReading from './ContinueReading';
import EntriesTiles from './EntriesTiles';
import HomePageTitle from './HomePageTitle';
import NewChaptersBlock from './NewChaptersBlock';

/** Итог — главная: «Продолжить чтение» (C1a + U1), «Новые главы в закладках» списком (W2) и две
 *  плитки «Подборки» и «Источники» (V2a). Пустой не бывает: плитки есть всегда. */
function HomeFinalPage() {
  return (
    <Stack gap="xl">
      <HomePageTitle withAllSources={false} />
      <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />
      <NewChaptersBlock asList />
      <EntriesTiles />
    </Stack>
  );
}

export default HomeFinalPage;
