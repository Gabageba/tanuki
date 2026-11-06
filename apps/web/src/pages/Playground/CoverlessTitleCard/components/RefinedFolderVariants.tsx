import { Stack, Text, Title } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import { PANEL_LAYOUT, REFINED_FOLDER_VARIANTS, type Example } from '../models';
import PreviewFrame from './PreviewFrame';
import SelectionsPreview from './SelectionsPreview';

type Props = { examples: Example[] };

function RefinedFolderVariants({ examples }: Props) {
  return (
    <Stack gap="xl">
      <Title order={4}>M5–M10 · Папка на выбранной базе</Title>
      <Text fz="sm" c="dimmed" maw={760}>
        Выбраны C2 + T1a + P2 + L2: две строки описания, одна строка тегов с лайками, поля друг под
        другом на телефоне, две колонки на десктопе. Здесь сравниваются метки папки: M5–M7 — общий
        тёмный квадрат, M8–M10 — цветной тег с одной иконкой. Пары M5/M8, M6/M9 и M7/M10 отличаются
        только оформлением. Имя папки — в подсказке и доступном названии ссылки. Без папки метка и
        её отступ исчезают.
      </Text>
      {REFINED_FOLDER_VARIANTS.map(({ options, ...variant }) => (
        <DemoSection key={variant.code} {...variant}>
          <PreviewFrame phone={false} wide>
            <SelectionsPreview
              phone={false}
              examples={examples}
              layout={PANEL_LAYOUT.STACKED}
              density={options.density}
              columns={options.columns}
              folderDecoration={options.folderDecoration}
            />
          </PreviewFrame>
          <PreviewFrame phone>
            <SelectionsPreview
              phone
              examples={examples}
              layout={PANEL_LAYOUT.STACKED}
              density={options.density}
              columns={options.columns}
              folderDecoration={options.folderDecoration}
            />
          </PreviewFrame>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default RefinedFolderVariants;
