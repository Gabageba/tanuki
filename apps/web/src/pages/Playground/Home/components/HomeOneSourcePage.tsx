import { Stack, Title } from '@mantine/core';
import { MOCK_CONTINUE, MOCK_HOME_ALL } from '../mocks';
import { CONTINUE_CARD, type SourcePicker } from '../models';
import ContinueReading from './ContinueReading';
import HomePageTitle from './HomePageTitle';
import OneSourceSelections from './OneSourceSelections';

type Props = {
  picker: SourcePicker;
};

/** P3 — главная: «Продолжить чтение», ниже «Подборки источников» одного выбранного источника. */
function HomeOneSourcePage({ picker }: Props) {
  return (
    <Stack gap="xl">
      <HomePageTitle />
      <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />
      <Stack gap="md">
        <Title order={4}>Подборки источников</Title>
        <OneSourceSelections homes={MOCK_HOME_ALL} picker={picker} />
      </Stack>
    </Stack>
  );
}

export default HomeOneSourcePage;
