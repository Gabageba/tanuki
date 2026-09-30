import { useState, type ReactNode } from 'react';
import { Box, Group, Stack, Text, Title } from '@mantine/core';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import VariantCurrent from './components/VariantCurrent';
import VariantRowThumbs from './components/VariantRowThumbs';
import VariantRows from './components/VariantRows';
import VariantSegmented from './components/VariantSegmented';
import VariantTiles from './components/VariantTiles';
import { MOBILE_FRAME_WIDTH, type VariantProps } from './models';

type Variant = {
  code: string;
  title: string;
  description: string;
  /** Ширина десктопной примерки: плитки — во всю страницу, строки — в колонку настроек. */
  desktopWidth?: number;
  render: (props: VariantProps) => ReactNode;
};

// Колонка «Общих» настроек на десктопе: GroupedList там стоят в сетке из двух.
const SETTINGS_COLUMN_WIDTH = 620;

const VARIANTS: Variant[] = [
  {
    code: 'T0',
    title: 'Как сейчас',
    description:
      'Три карточки на всю ширину страницы. На десктопе превью растянуто в полосу, на телефоне блок занимает полтора экрана.',
    render: (props) => <VariantCurrent {...props} />,
  },
  {
    code: 'T1',
    title: 'Компактные плитки',
    description:
      'Те же карточки, но с потолком ширины: превью 16:10, под ним иконка и название, без пояснения. Три в ряд и на телефоне.',
    render: (props) => <VariantTiles {...props} />,
  },
  {
    code: 'T2',
    title: 'Строка с миниатюрами',
    description:
      'Обычная строка настроек, справа три миниатюры. Название выбранной схемы — в пояснении, остальных — в подсказке. На телефоне миниатюры переносятся под заголовок.',
    desktopWidth: SETTINGS_COLUMN_WIDTH,
    render: (props) => <VariantRowThumbs {...props} />,
  },
  {
    code: 'T3',
    title: 'Строки списка',
    description:
      'Каждая схема — строка GroupedList: миниатюра на месте иконки, название и пояснение, радио справа. Одинаково на десктопе и телефоне. В макете нажимается только радио, в приложении — вся строка.',
    desktopWidth: SETTINGS_COLUMN_WIDTH,
    render: (props) => <VariantRows {...props} />,
  },
  {
    code: 'T4',
    title: 'Сегменты и одно превью',
    description:
      'Самый плотный: одна строка, выбор сегментами, превью одно — показывает выбранную схему. Сравнить схемы глазами до выбора нельзя.',
    desktopWidth: SETTINGS_COLUMN_WIDTH,
    render: (props) => <VariantSegmented {...props} />,
  },
];

/** Выбор темы в настройках: карточки из макета слишком крупные — ищем размер и раскладку. */
function PlaygroundThemePicker() {
  // Свой стейт, а не схема приложения: иначе каждый клик перекрашивал бы всю страницу.
  const [value, setValue] = useState<ColorScheme>(COLOR_SCHEME.DARK);

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Выбор темы</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Каждый вариант — на десктопе и в рамке телефона {MOBILE_FRAME_WIDTH}px. Выбор общий для всех
        вариантов и саму схему приложения не меняет — её переключите в шапке, чтобы посмотреть обе.
      </Text>
      {VARIANTS.map(({ code, title, description, desktopWidth, render }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <Stack gap="lg" mt="xs">
            <Stack gap={6}>
              <Text fz={12} c="dimmed">
                Десктоп
              </Text>
              <Box maw={desktopWidth}>{render({ value, onChange: setValue, narrow: false })}</Box>
            </Stack>
            <Stack gap={6}>
              <Text fz={12} c="dimmed">
                Телефон
              </Text>
              <Box
                w={MOBILE_FRAME_WIDTH}
                maw="100%"
                p="md"
                style={{
                  border: '1px dashed var(--mantine-color-default-border)',
                  borderRadius: 'var(--mantine-radius-md)',
                }}
              >
                {render({ value, onChange: setValue, narrow: true })}
              </Box>
            </Stack>
          </Stack>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundThemePicker;
