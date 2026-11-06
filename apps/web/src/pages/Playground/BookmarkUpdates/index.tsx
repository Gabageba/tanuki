import { useState } from 'react';
import { Button, Collapse, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import {
  ArchiveIcon,
  CardsIcon,
  ListIcon,
  SquaresFourIcon,
  TextAlignLeftIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SandboxOnly from '../components/SandboxOnly';
import { META_VARIANTS, EXAMPLE_SET, PREVIOUS_VARIANTS, type ExampleSet } from './models';
import { BASIC_EXAMPLES_SET, EDGE_EXAMPLES_SET, NAME_EXAMPLES_SET } from './mocks';
import BookmarkUpdatesComparison from './components/BookmarkUpdatesComparison';

function PlaygroundBookmarkUpdates() {
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.GRID);
  const [exampleSet, setExampleSet] = useState<ExampleSet>(EXAMPLE_SET.NAMES);
  const [showPrevious, setShowPrevious] = useState(false);
  const getExamples = () => {
    switch (exampleSet) {
      case EXAMPLE_SET.NAMES:
        return NAME_EXAMPLES_SET;
      case EXAMPLE_SET.BASIC:
        return BASIC_EXAMPLES_SET;
      case EXAMPLE_SET.EDGE_CASES:
        return EDGE_EXAMPLES_SET;
    }
  };
  const examples = getExamples();

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Новые главы в закладках</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={900}>
        Итог: выбран N18 — оранжевая мета при новых главах, с обычным названием. Реализован в
        BookmarkCard. Рядом сохранены прежняя точка N0 и боковые линии N16–N17. Сравните названия в
        одну и две строки, а также обрезку с «…» в плитке и списке. Слева — рамка 560 px, справа —
        320 px; на узком экране рамки идут друг под другом. Прежние N1–N15 свёрнуты внизу. Всё без
        пометки «Только песочница» показано так, как пойдёт в реализацию. Обложки вымышленные,
        действия меню — макеты. Проверьте обе темы.
      </Text>
      <SandboxOnly>
        <Stack gap="sm">
          <SegmentedControl
            aria-label="Вид карточек"
            value={viewMode}
            onChange={(value) => {
              switch (value) {
                case VIEW_MODE.GRID:
                case VIEW_MODE.LIST:
                  setViewMode(value);
              }
            }}
            data={[
              {
                value: VIEW_MODE.GRID,
                label: (
                  <Group gap={6} wrap="nowrap">
                    <SquaresFourIcon size={16} />
                    Плитка
                  </Group>
                ),
              },
              {
                value: VIEW_MODE.LIST,
                label: (
                  <Group gap={6} wrap="nowrap">
                    <ListIcon size={16} />
                    Список
                  </Group>
                ),
              },
            ]}
          />
          <SegmentedControl
            aria-label="Примеры закладок"
            size="xs"
            value={exampleSet}
            onChange={(value) => {
              switch (value) {
                case EXAMPLE_SET.NAMES:
                case EXAMPLE_SET.BASIC:
                case EXAMPLE_SET.EDGE_CASES:
                  setExampleSet(value);
              }
            }}
            data={[
              {
                value: EXAMPLE_SET.NAMES,
                label: (
                  <Group gap={4} wrap="nowrap">
                    <TextAlignLeftIcon size={14} />
                    Названия
                  </Group>
                ),
              },
              {
                value: EXAMPLE_SET.BASIC,
                label: (
                  <Group gap={4} wrap="nowrap">
                    <CardsIcon size={14} />
                    Обычные
                  </Group>
                ),
              },
              {
                value: EXAMPLE_SET.EDGE_CASES,
                label: (
                  <Group gap={4} wrap="nowrap">
                    <WarningCircleIcon size={14} />
                    Сложные
                  </Group>
                ),
              },
            ]}
          />
        </Stack>
      </SandboxOnly>
      {META_VARIANTS.map((variant) => (
        <BookmarkUpdatesComparison
          key={variant.id}
          variant={
            variant.code === 'N18' ? { ...variant, title: `Итог · ${variant.title}` } : variant
          }
          examples={examples}
          viewMode={viewMode}
        />
      ))}
      <SandboxOnly>
        <Button
          variant="default"
          leftSection={<ArchiveIcon />}
          onClick={() => setShowPrevious(!showPrevious)}
        >
          {showPrevious ? 'Скрыть прежние N1–N15' : 'Показать прежние N1–N15'}
        </Button>
      </SandboxOnly>
      <Collapse expanded={showPrevious}>
        <Stack gap="xl">
          {PREVIOUS_VARIANTS.map((variant) => (
            <BookmarkUpdatesComparison
              key={variant.id}
              variant={variant}
              examples={examples}
              viewMode={viewMode}
            />
          ))}
        </Stack>
      </Collapse>
    </Stack>
  );
}

export default PlaygroundBookmarkUpdates;
