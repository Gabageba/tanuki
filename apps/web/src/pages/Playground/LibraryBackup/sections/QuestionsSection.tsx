import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import SummaryVariant from '../components/SummaryVariant';
import { QUESTION_VIEW, SUMMARY_STATE } from '../models';

const STATES = [SUMMARY_STATE.CONFLICTS];

/** Q — вопросы о конфликтах. */
function QuestionsSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Q"
        title="Вопросы о конфликтах"
        description="Radio.Card строками — как выбор папки и темы. Вопрос появляется, только если есть о чём спрашивать: 7 тайтлов в другой папке, 5 расходящихся отметок (у 3 копия дальше). Флажок настроек — всегда, по умолчанию выключен. Ответы живые."
      />
      <DemoSection
        code="Q1a"
        title="Число в заголовке вопроса"
        description="«7 тайтлов уже в закладках, но в другой папке» — масштаб сразу в вопросе, ответы описывают правило."
        pros={[
          'Сразу видно, сколько всего вопрос затрагивает',
          'Описания ответов короткие и одинаковой высоты',
        ]}
        cons={[
          'Сколько изменит конкретный ответ («3 сдвинутся вперёд»), не сказано',
          'Заголовок вопроса длинный — на телефоне в две строки',
        ]}
      >
        <SummaryVariant states={STATES} phoneState={SUMMARY_STATE.CONFLICTS} />
      </DemoSection>
      <DemoSection
        code="Q1b"
        title="Число у ответов"
        description="Вопрос назван коротко, а каждый ответ говорит, что он изменит: «7 тайтлов переедут», «3 отметки сдвинутся вперёд, 2 останутся», «Ничего не изменится»."
        pros={[
          'Цена ответа видна у самого ответа — то, что нужно для решения',
          'Видно, что «Дальше прочитанное» тоже что-то заменяет',
        ]}
        cons={[
          'У «Оставить мои» и «Мой текущий» числа нет — описания разной длины',
          'Сколько всего расходится, приходится складывать в уме',
        ]}
      >
        <SummaryVariant
          layout={{ question: QUESTION_VIEW.COUNT_IN_CARD }}
          states={STATES}
          phoneState={SUMMARY_STATE.CONFLICTS}
        />
      </DemoSection>
    </Stack>
  );
}

export default QuestionsSection;
