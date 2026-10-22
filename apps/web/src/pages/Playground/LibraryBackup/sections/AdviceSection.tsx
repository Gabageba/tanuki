import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import SummaryVariant from '../components/SummaryVariant';
import { ADVICE_VIEW, FOLDER_POLICY, SUMMARY_STATE, type AdviceView } from '../models';

const STATES = [SUMMARY_STATE.CONFLICTS];
const REPLACING_CHOICES = { folderPolicy: FOLDER_POLICY.FROM_BACKUP };

type VariantProps = {
  advice: AdviceView;
};

function AdviceVariant({ advice }: VariantProps) {
  return (
    <SummaryVariant
      layout={{ advice }}
      states={STATES}
      phoneState={SUMMARY_STATE.CONFLICTS}
      initialChoices={REPLACING_CHOICES}
    />
  );
}

/** W — совет скачать копию текущей библиотеки при заменяющем выборе. */
function AdviceSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="W"
        title="Совет скачать копию"
        description="Отмены восстановления нет, поэтому при любом заменяющем выборе (здесь — «Взять из копии») модалка становится золотой и советует сначала сохранить текущую библиотеку. Выберите «Оставить мои» и «Мой текущий» — совет исчезнет."
      />
      <DemoSection
        code="W1"
        title="Текст и кнопка под вопросами"
        description="Пояснение dimmed 13 и под ним лёгкая кнопка «Скачать текущую копию» — рядом с выбором, который её вызвал."
        pros={['Совет стоит сразу под причиной', 'Кнопка не спорит с «Восстановить»: другой вес']}
        cons={['Ещё одна кнопка в теле — модалка растёт на две строки']}
      >
        <AdviceVariant advice={ADVICE_VIEW.TEXT} />
      </DemoSection>
      <DemoSection
        code="W2"
        title="Строка GroupedList"
        description="Блок «Перед восстановлением» со строкой «Текущая библиотека» и кнопкой «Скачать копию» — как строка в профиле."
        pros={['Та же кнопка «Скачать копию», что в профиле, — понятно, что она делает']}
        cons={['Рядом с S1 выглядит как ещё одна часть сводки', 'Самый высокий вариант']}
      >
        <AdviceVariant advice={ADVICE_VIEW.ROW} />
      </DemoSection>
      <DemoSection
        code="W3"
        title="Кнопка в ряду кнопок"
        description="Пояснение в теле, а «Скачать текущую копию» — слева от «Отмена» и «Восстановить»."
        pros={['Заметнее всего — стоит там, куда смотрят перед нажатием']}
        cons={[
          'Три кнопки: на телефоне ряд переносится, «Скачать» легко спутать с главной',
          'Кнопка и её пояснение разнесены по модалке',
        ]}
      >
        <AdviceVariant advice={ADVICE_VIEW.BUTTON} />
      </DemoSection>
      <DemoSection
        code="W4"
        title="Ссылка в тексте"
        description="«Перед восстановлением скачайте копию текущей библиотеки» — ссылка внутри фразы."
        pros={['Тише всего — модалка почти не растёт']}
        cons={[
          'Единственную страховку легко не заметить',
          'Ссылка, которая качает файл, а не ведёт на страницу, — неожиданно',
        ]}
      >
        <AdviceVariant advice={ADVICE_VIEW.LINK} />
      </DemoSection>
    </Stack>
  );
}

export default AdviceSection;
