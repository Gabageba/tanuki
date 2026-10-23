import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import DemoSection from '../../components/DemoSection';
import DoneStep from '../components/DoneStep';
import { DONE_VIEW, type DoneView } from '../models';

type VariantProps = {
  view: DoneView;
};

function DoneVariant({ view }: VariantProps) {
  return (
    <Group align="flex-start" gap="lg">
      <CaptionedFrame caption="Десктоп · 440 px">
        <DoneStep view={view} />
      </CaptionedFrame>
      <CaptionedFrame caption="Телефон · 375 px">
        <DoneStep view={view} isPhone />
      </CaptionedFrame>
    </Group>
  );
}

/** G — шаг «Готово»: как сказать, что отметки ещё переносятся. */
function DoneSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="G"
        title="Шаг «Готово»"
        description="Тон success, строки — как D1 копии. Закладки и папки уже записаны, а отметки «где остановился» сервер достроит в фоне за несколько минут и пришлёт уведомление. Вопрос — как это сказать."
      />
      <DemoSection
        code="G1"
        title="Строкой итога со счётчиком"
        description="«Где остановился +112» — такая же строка, как закладки и папки, а описание говорит, что отметки появятся позже."
        pros={[
          'Тот же вид, что строки копии, — сверяется со сводкой',
          'Число на месте, где его ищут',
        ]}
        cons={[
          '«+112» выглядит уже записанным, хотя часть может не найтись',
          'Что это позже, сказано только мелким описанием',
        ]}
      >
        <DoneVariant view={DONE_VIEW.ROW} />
      </DemoSection>
      <DemoSection
        code="G2"
        title="Пояснением под строками"
        description="В строках — только то, что уже записано; про отметки — серой фразой под рамкой."
        pros={['Строки честные: только уже сделанное', 'Фраза читается как «что будет дальше»']}
        cons={[
          'Число отметок — в тексте, не в колонке чисел',
          'Пояснение под рамкой легко пропустить',
        ]}
      >
        <DoneVariant view={DONE_VIEW.NOTE} />
      </DemoSection>
      <DemoSection
        code="G3"
        title="Строкой «в процессе»"
        description="Строка «Где остановился — переносим» с Loader вместо иконки и серым числом: видно, что работа идёт."
        pros={['Сразу видно, что ещё не готово', 'Число остаётся в колонке']}
        cons={[
          'Спиннер, который не дойдёт до конца, пока окно открыто — оно не обновляется',
          'Loader в итоге — против правила «нет спиннера у блока»',
        ]}
      >
        <DoneVariant view={DONE_VIEW.LOADER} />
      </DemoSection>
    </Stack>
  );
}

export default DoneSection;
