import { useState } from 'react';
import { Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { CardsIcon, WarningCircleIcon } from '@phosphor-icons/react';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import { EXAMPLE_SET, VARIANTS, type ExampleSet } from './models';
import { getExamples } from './lib';
import MarkerComparison from './components/MarkerComparison';

function PlaygroundTitleBookmarkMarkers() {
  const [exampleSet, setExampleSet] = useState<ExampleSet>(EXAMPLE_SET.BASIC);
  const examples = getExamples(exampleSet);

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Маркеры папки в списке</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={900}>
        Итог — прежняя метка K4a на обложке. M0–M3 сохранены как отклонённые варианты: справа от
        названия, перед ним, флажок на обложке и плашка внизу. Слева — каталог с обложкой 120 px,
        справа — компактные «Новые главы» с обложкой 84 px в рамке 320 px. Сравните обе темы и
        длинные названия. Всё без пометки «Только песочница» показано так, как пойдёт в реализацию.
        Обложки вымышленные.
      </Text>
      <SandboxOnly>
        <SegmentedControl
          value={exampleSet}
          onChange={(value) => {
            switch (value) {
              case EXAMPLE_SET.BASIC:
              case EXAMPLE_SET.EDGE_CASES:
                setExampleSet(value);
            }
          }}
          data={[
            {
              value: EXAMPLE_SET.BASIC,
              label: (
                <Group gap={6} wrap="nowrap">
                  <CardsIcon size={16} />
                  <Text size="sm">Папки</Text>
                </Group>
              ),
            },
            {
              value: EXAMPLE_SET.EDGE_CASES,
              label: (
                <Group gap={6} wrap="nowrap">
                  <WarningCircleIcon size={16} />
                  <Text size="sm">Сложные случаи</Text>
                </Group>
              ),
            },
          ]}
        />
      </SandboxOnly>
      <DemoSection
        code="K4a"
        title="Итог: прежняя метка на обложке"
        description="Выбрано 4 ноября 2026 г.: квадрат на тёмной подложке в левом нижнем углу обложки, с залитой иконкой цвета папки. В плитке — 26 px, в списке — 22 px."
        pros={[
          'Название и нижняя строка сохраняют всю ширину',
          'Метка стоит на одном месте в плитке и списке',
        ]}
        cons={['Перекрывает небольшой участок обложки']}
      >
        <MarkerComparison examples={examples} chosen />
      </DemoSection>
      {VARIANTS.map(({ id, code, title, description, pros, cons }) => (
        <DemoSection
          key={id}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <MarkerComparison examples={examples} variant={id} />
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundTitleBookmarkMarkers;
