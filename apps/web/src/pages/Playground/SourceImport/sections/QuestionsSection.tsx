import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import DemoSection from '../../components/DemoSection';
import QuestionsStep from '../components/QuestionsStep';

/** Q — шаг «Вопросы», без вариантов: повторяет Q1a копии. */
function QuestionsSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Q"
        title="Шаг «Вопросы»"
        description="Только при конфликтах среди выбранных. По плану — тот же вид, что Q1a у восстановления из копии, через общий компонент; здесь — чтобы сверить тексты с «из источника» вместо «из копии»."
      />
      <DemoSection
        code="Q1"
        title="Как Q1a копии"
        description="Число — в заголовке вопроса, у ответов — правило. Флажка настроек нет: с сайта настройки не приходят."
        pros={[
          'Тот же компонент, что у копии, — второй потребитель',
          'Ответы по умолчанию ничего не теряют',
        ]}
        cons={[
          '«Взять из источника» и «С источника» — два слова для одного, как «Взять из копии» / «Из копии»',
        ]}
      >
        <Group align="flex-start" gap="lg">
          <CaptionedFrame caption="Десктоп · 440 px">
            <QuestionsStep />
          </CaptionedFrame>
          <CaptionedFrame caption="Телефон · 375 px">
            <QuestionsStep isPhone />
          </CaptionedFrame>
        </Group>
      </DemoSection>
    </Stack>
  );
}

export default QuestionsSection;
