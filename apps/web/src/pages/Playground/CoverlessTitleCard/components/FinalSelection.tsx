import { Stack, Title } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import { FINAL_CARD_OPTIONS, FINAL_COMBINATION, PANEL_LAYOUT, type Example } from '../models';
import PreviewFrame from './PreviewFrame';
import SelectionsPreview from './SelectionsPreview';

type Props = { examples: Example[] };

function FinalSelection({ examples }: Props) {
  return (
    <Stack gap="xl">
      <Title order={3} id="axis-★">
        Итог
      </Title>
      <DemoSection
        code={FINAL_COMBINATION}
        title="Папка слева, 18+ справа"
        description="M9 с уточнением: тег с иконкой папки слева от названия, 18+ — у правого края той же строки. Оба тега высотой 20 px. Название и описание — до двух строк; теги одной строкой с +N, лайки справа. На десктопе две колонки, на телефоне одна, поля месяца и сортировки друг под другом."
        pros={[
          'Теги папки и 18+ одинаковой высоты',
          'Имя папки не сужает название',
          'Название не начинается с двух тегов подряд',
        ]}
        cons={[
          'Маркеры с двух сторон уменьшают ширину названия',
          'Полное имя папки доступно в подсказке',
        ]}
      >
        <PreviewFrame phone={false} wide>
          <SelectionsPreview
            phone={false}
            examples={examples}
            layout={PANEL_LAYOUT.STACKED}
            {...FINAL_CARD_OPTIONS}
          />
        </PreviewFrame>
        <PreviewFrame phone>
          <SelectionsPreview
            phone
            examples={examples}
            layout={PANEL_LAYOUT.STACKED}
            {...FINAL_CARD_OPTIONS}
          />
        </PreviewFrame>
      </DemoSection>
    </Stack>
  );
}

export default FinalSelection;
