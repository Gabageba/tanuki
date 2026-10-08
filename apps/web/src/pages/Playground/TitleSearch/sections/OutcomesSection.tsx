import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import MissedLine from '../components/MissedLine';
import NothingFound from '../components/NothingFound';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import { MOCK_MISSED } from '../mocks';
import type { Variant } from '../models';

const VARIANTS: Variant[] = [
  {
    code: 'X1',
    title: 'Ничего не найдено',
    description:
      'Все опрошенные ответили пусто, фильтров нет. Под EmptyState — «Не ответили», если такие есть (здесь — один).',
    pros: ['Подсказка, что попробовать: другое написание или оригинальное название'],
    cons: [],
    render: () => (
      <VariantFrames>
        <Stack gap="lg">
          <NothingFound />
          <MissedLine missed={MOCK_MISSED.slice(0, 1)} />
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'X2',
    title: 'Ничего не найдено с фильтрами',
    description: 'То же, но фильтры выбраны: в EmptyState — «Сбросить фильтры».',
    pros: ['Ясно, что виноваты, скорее всего, фильтры, и как это исправить'],
    cons: [],
    render: () => (
      <VariantFrames>
        <NothingFound withFilters />
      </VariantFrames>
    ),
  },
  {
    code: 'X3',
    title: 'Никто не ответил',
    description:
      'Ни один источник не ответил: тот же EmptyState, а «Не ответили» с «Повторить» — главное на экране.',
    pros: ['Не притворяется, что тайтла нет: видно, что искать было негде'],
    cons: ['EmptyState «Ничего не найдено» тут не совсем честен — ничего и не искали'],
    render: () => (
      <VariantFrames>
        <Stack gap="lg">
          <NothingFound />
          <MissedLine missed={MOCK_MISSED} />
        </Stack>
      </VariantFrames>
    ),
  },
];

/** Пустые выдачи — по плану, одним оформлением; строка «Не ответили» здесь — N1. */
function OutcomesSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="X"
        title="Пустые выдачи"
        description="Не ось — состояния из «Крайних случаев» плана в одном оформлении, чтобы проверить тексты. Строка «Не ответили» в них будет та, что выберете на оси N; здесь для примера — N1."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default OutcomesSection;
