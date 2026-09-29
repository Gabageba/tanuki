import type { ComponentType } from 'react';
import { Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import { getStateLabel } from './lib';
import { ACCOUNT_STATES, type VariantProps } from './models';
import VariantCurrent from './components/VariantCurrent';
import VariantAccountTitle from './components/VariantAccountTitle';
import VariantAvatar from './components/VariantAvatar';
import VariantTint from './components/VariantTint';
import VariantTintAccent from './components/VariantTintAccent';
import VariantTintTitle from './components/VariantTintTitle';
import VariantInLabel from './components/VariantInLabel';
import VariantTree from './components/VariantTree';
import VariantSourceMarks from './components/VariantSourceMarks';

type Variant = {
  code: string;
  title: string;
  description: string;
  component: ComponentType<VariantProps>;
};

const VARIANTS: Variant[] = [
  {
    code: 'H0',
    title: 'Как сейчас',
    description:
      'Шапка — такая же строка, как источники: без фона, с серой иконкой. Статус — мелкий бейдж во втором ряду.',
    component: VariantCurrent,
  },
  {
    code: 'H1',
    title: 'Подложка + аккаунт в заголовке',
    description:
      'Шапка на сером фоне. В заголовке сам аккаунт (логин или «не привязан»), пояснение про источники ниже — вторым рядом, рядом с точкой статуса.',
    component: VariantAccountTitle,
  },
  {
    code: 'H2',
    title: 'Аватар',
    description:
      'H1, но вместо иконки — аватар: пустой пунктирный кружок, пока не вошли, инициалы и точка статуса — после. «Войти заново» вынесено на кнопку.',
    component: VariantAvatar,
  },
  {
    code: 'H3',
    title: 'Цвет состояния',
    description:
      'Вся шапка подкрашена: серая — не привязан, зелёная — вошли, золотая — сессия протухла. Заголовок — само состояние, логин под ним.',
    component: VariantTint,
  },
  {
    code: 'H3a',
    title: 'Цвет состояния, «не привязан» — terracotta',
    description:
      'H3, но без входа шапка подкрашена не серым, а фирменным цветом — вместе с кнопкой «Войти» читается как призыв к действию.',
    component: VariantTintAccent,
  },
  {
    code: 'H3b',
    title: 'Серый фон, цветные иконка и заголовок',
    description:
      'H3a спокойнее: подложка всегда серая, как в H1, а состояние показывают только иконка и заголовок — terracotta, зелёный или золотой.',
    component: VariantTintTitle,
  },
  {
    code: 'H4',
    title: 'Аккаунт в подписи группы',
    description:
      'Строки-шапки нет: логин с точкой и действие стоят справа от «GROUPLE». В рамке только источники — путать нечего, и блок ниже.',
    component: VariantInLabel,
  },
  {
    code: 'H5',
    title: 'Дерево',
    description:
      'От аватара шапки вниз идёт линия с ответвлением к каждому источнику: «один аккаунт на всех» читается из формы. Линия серая пунктирная, пока не вошли, и цветная сплошная — после.',
    component: VariantTree,
  },
  {
    code: 'H6',
    title: 'Аватар + точки на источниках',
    description:
      'H2, и статус аккаунта повторён точкой на иконке каждого источника — видно, через что сейчас читается источник.',
    component: VariantSourceMarks,
  },
];

/** Шапка группы источников под одним аккаунтом: чтобы читалась как шапка и было видно, вошли ли. */
function PlaygroundAccountGroups() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Шапка группы с аккаунтом</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Каждый вариант — в трёх состояниях: не привязан, вошли, нужно войти заново.
      </Text>
      {VARIANTS.map(({ code, title, description, component: Variant }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="xl" verticalSpacing="lg">
            {ACCOUNT_STATES.map((state) => (
              <Stack key={state} gap={6}>
                <Text fz={12} c="dimmed">
                  {getStateLabel(state)}
                </Text>
                <Variant state={state} />
              </Stack>
            ))}
          </SimpleGrid>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundAccountGroups;
