import type { ReactNode } from 'react';
import { Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { getMutedBackground, getMutedBorderColor } from '@/shared/lib/palette';
import DemoSection from '../components/DemoSection';
import { getStateLabel } from '../AccountGroups/lib';
import { ACCOUNT_STATES, type AccountState } from '../AccountGroups/models';
import { getHeaderColor } from './lib';
import VariantInFrame from './components/VariantInFrame';
import VariantOutside from './components/VariantOutside';

type Variant = {
  code: string;
  title: string;
  description: string;
  render: (state: AccountState) => ReactNode;
};

const VARIANTS: Variant[] = [
  {
    code: 'B0',
    title: 'Как сейчас',
    description:
      'Серая подложка `--mantine-color-default-hover` — в светлой теме почти совпадает с фоном страницы.',
    render: (state) => <VariantInFrame state={state} bg="var(--mantine-color-default-hover)" />,
  },
  {
    code: 'B1',
    title: 'Без заливки, цветная линия снизу',
    description:
      'Шапка белая, как строки. От источников её отделяет не серый фон, а линия цвета состояния — первая строка списка, а не отдельная плашка.',
    render: (state) => (
      <VariantInFrame
        state={state}
        style={{ boxShadow: `inset 0 -1px 0 ${getMutedBorderColor(getHeaderColor(state), true)}` }}
      />
    ),
  },
  {
    code: 'B2',
    title: 'Оттенок цвета состояния',
    description:
      'Подложка — 10% цвета состояния поверх поверхности: тёплая, пока не вошли, зелёная — после, золотая — когда пора войти заново.',
    render: (state) => (
      <VariantInFrame state={state} bg={getMutedBackground(getHeaderColor(state), true)} />
    ),
  },
  {
    code: 'B3',
    title: 'Полоса слева',
    description:
      'Фон белый, по левому краю шапки — полоса 3px цвета состояния. Заметнее всего, при этом без заливки.',
    render: (state) => (
      <VariantInFrame
        state={state}
        style={{ boxShadow: `inset 3px 0 0 var(--mantine-color-${getHeaderColor(state)}-filled)` }}
      />
    ),
  },
  {
    code: 'B4',
    title: 'Над рамкой',
    description:
      'Шапка вынесена из рамки и стоит на фоне страницы, под подписью группы. В рамке только источники — фон шапки выбирать не из чего.',
    render: (state) => <VariantOutside state={state} />,
  },
];

/** Фон шапки GroupedList: серая подложка теряется на светлом фоне страницы — ищем замену. */
function PlaygroundHeaderBackground() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Фон шапки группы</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Каждый вариант — в трёх состояниях аккаунта. Смотрите в обеих темах: переключите схему в
        шапке приложения.
      </Text>
      {VARIANTS.map(({ code, title, description, render }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="xl" verticalSpacing="lg">
            {ACCOUNT_STATES.map((state) => (
              <Stack key={state} gap={6}>
                <Text fz={12} c="dimmed">
                  {getStateLabel(state)}
                </Text>
                {render(state)}
              </Stack>
            ))}
          </SimpleGrid>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundHeaderBackground;
