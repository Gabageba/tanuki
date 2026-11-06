import { Stack, Title } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import { PANEL_LAYOUT, type Example } from '../models';
import PreviewFrame from './PreviewFrame';
import SelectionsPreview from './SelectionsPreview';

type Props = { examples: Example[] };

const VARIANTS = [
  {
    code: 'P1',
    title: 'Два поля рядом',
    description:
      'Месяц и порядок остаются в одной строке на любой ширине. Переключите вкладку: обычный вид сохраняется при возврате из «Популярных». Данные месяцев вымышленные.',
    pros: ['Панель не увеличивает высоту на телефоне'],
    cons: ['Подписи в узких полях могут обрезаться'],
    layout: PANEL_LAYOUT.ROW,
  },
  {
    code: 'P2',
    title: 'На телефоне — друг под другом',
    description:
      'На десктопе поля стоят рядом, на телефоне каждое занимает всю ширину. Состав и поведение вкладок те же, что у P1.',
    pros: ['Обе подписи видны на узком экране'],
    cons: ['Панель занимает две строки перед выдачей'],
    layout: PANEL_LAYOUT.STACKED,
  },
];

function PanelAxis({ examples }: Props) {
  return (
    <Stack gap="xl">
      <Title order={3} id="axis-P">
        P · Месяц и сортировка
      </Title>
      {VARIANTS.map(({ layout, ...variant }) => (
        <DemoSection key={variant.code} {...variant}>
          <PreviewFrame phone={false}>
            <SelectionsPreview phone={false} examples={examples} layout={layout} />
          </PreviewFrame>
          <PreviewFrame phone>
            <SelectionsPreview phone examples={examples} layout={layout} />
          </PreviewFrame>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PanelAxis;
