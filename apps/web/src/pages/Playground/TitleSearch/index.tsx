import { useMemo, useState } from 'react';
import { Anchor, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { RowsIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { VIEW_MODE, ViewModeSchema, type ViewMode } from '@tanuki/contracts';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SandboxOnly from '../components/SandboxOnly';
import { VIEW_MODE_CONTEXT } from './models';
import EmptyPageSection from './sections/EmptyPageSection';
import FiltersSection from './sections/FiltersSection';
import HeaderSection from './sections/HeaderSection';
import LayoutSection from './sections/LayoutSection';
import MissedSection from './sections/MissedSection';
import OutcomesSection from './sections/OutcomesSection';
import RecentSection from './sections/RecentSection';
import SectionHeaderSection from './sections/SectionHeaderSection';
import SummarySection from './sections/SummarySection';
import RefinementSection from './sections/RefinementSection';

const AXES = [
  { letter: 'Итог', title: 'выбранное' },
  { letter: 'G', title: 'вид на десктопе' },
  { letter: 'M', title: 'строка на телефоне' },
  { letter: 'C', title: 'чипы' },
  { letter: 'V', title: '«Показать ещё»' },
  { letter: 'N5', title: '«Не ответили»' },
  { letter: 'R', title: 'разделитель' },
  { letter: 'H', title: 'шапка' },
  { letter: 'S', title: 'секция' },
  { letter: 'L', title: 'карточки' },
  { letter: 'N', title: '«Не ответили»' },
  { letter: 'X', title: 'пустые выдачи' },
  { letter: 'D', title: 'недавние' },
  { letter: 'E', title: 'пустая /search' },
  { letter: 'F', title: 'фильтры' },
];

/** Поиск тайтлов: макеты по «Вопросам к макетам» плана docs/plans/title-search.md. */
function PlaygroundTitleSearch() {
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.GRID);
  const viewModeContext = useMemo(() => ({ viewMode, setViewMode }), [viewMode]);

  return (
    <VIEW_MODE_CONTEXT value={viewModeContext}>
      <Stack gap="xl" p="md">
        <Group gap="xs">
          <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
          <Title order={2}>Поиск тайтлов</Title>
        </Group>
        <Stack gap="xs" maw={760}>
          <Text c="dimmed" fz="sm">
            Варианты по осям — итог собирается комбинацией (H1 + S1 + L2 + …). Каждая ось отвечает
            на свой вопрос из плана; первым идёт «Как сейчас». Каждый вариант показан в ширине
            десктопа и в рамке телефона 375 px. Смотрите в обеих темах — переключите схему в шапке
            приложения.
          </Text>
          <Text c="dimmed" fz="sm">
            Запрос везде «Поднятие уровня в одиночку»: нашлось на четырёх источниках (10, 6, 3 и 1
            карточка), четыре не ответили — по одному на каждую причину. Фильтры, «Показать ещё»,
            сворачивание и вид карточек живые. Всё без пометки «Только песочница» показано так, как
            пойдёт в реализацию; обложки — случайные картинки.
          </Text>
          <Group gap="xs">
            {AXES.map(({ letter, title }) => (
              <Anchor key={letter} href={`#axis-${letter}`} fz="sm" ff="monospace">
                {letter}
                <Text component="span" inherit ff="body" c="dimmed">
                  {' '}
                  {title}
                </Text>
              </Anchor>
            ))}
          </Group>
          <SandboxOnly>
            <Group gap="sm">
              <Text fz="sm">Вид карточек на всей странице</Text>
              <SegmentedControl
                value={viewMode}
                onChange={(next) => {
                  const parsed = ViewModeSchema.safeParse(next);
                  if (parsed.success) setViewMode(parsed.data);
                }}
                data={[
                  {
                    value: VIEW_MODE.GRID,
                    label: (
                      <Group gap={6} wrap="nowrap">
                        <SquaresFourIcon size={16} />
                        Сетка
                      </Group>
                    ),
                  },
                  {
                    value: VIEW_MODE.LIST,
                    label: (
                      <Group gap={6} wrap="nowrap">
                        <RowsIcon size={16} />
                        Список
                      </Group>
                    ),
                  },
                ]}
              />
            </Group>
          </SandboxOnly>
        </Stack>
        <SummarySection />
        <RefinementSection />
        <HeaderSection />
        <SectionHeaderSection />
        <LayoutSection />
        <MissedSection />
        <OutcomesSection />
        <RecentSection />
        <EmptyPageSection />
        <FiltersSection />
      </Stack>
    </VIEW_MODE_CONTEXT>
  );
}

export default PlaygroundTitleSearch;
