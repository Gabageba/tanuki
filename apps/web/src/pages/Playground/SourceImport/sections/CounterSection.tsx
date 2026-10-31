import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import TitlesPair from '../components/TitlesPair';
import { LIBRARY } from '../mocks';
import { COUNTER_VIEW } from '../models';

/** K — где общий «Выбрано 87 из 124». */
function CounterSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="K"
        title="Счётчик выбранного"
        description="Общий чекбокс «все» и сколько выбрано, пока прокручивается список из сотни строк. Снимите пару групп — счётчик и кнопка меняются. Остальное — база L1 + R2 + A1 + P0 + M1."
      />
      <DemoSection
        code="K1"
        title="Сверху, над прокруткой"
        description="«Выбрано 87 из 124» с общим чекбоксом стоит над списком и не уезжает — как в заглушке."
        pros={['Всегда на виду, как и общий чекбокс', 'Уже так в заглушке — привычно']}
        cons={[
          'Ещё одна строка над и так длинным списком',
          'Число далеко от кнопки, которая им пользуется',
        ]}
      >
        <TitlesPair folders={LIBRARY} config={{ counter: COUNTER_VIEW.TOP }} />
      </DemoSection>
      <DemoSection
        code="K2"
        title="Внизу, рядом с кнопками"
        description="Общий чекбокс и «87 из 124» — в строке кнопок слева: сколько выбрано, видно прямо у «Далее»."
        pros={[
          'Список начинается сразу, без строки сверху',
          'Число рядом с действием, которое его использует',
        ]}
        cons={[
          'На 375 px чекбокс, «Отмена» и «Далее» едва помещаются в строку',
          'Общий чекбокс внизу ищут не сразу',
        ]}
      >
        <TitlesPair folders={LIBRARY} config={{ counter: COUNTER_VIEW.BOTTOM }} />
      </DemoSection>
      <DemoSection
        code="K3"
        title="В кнопке"
        description="Сверху только «Выбрать всё», а сколько выбрано — числом в самой кнопке «Далее 87» / «Импорт 87»."
        pros={['Без лишнего текста: число там, где решают', 'Строка сверху короче']}
        cons={['Не видно, из скольких выбрано', 'Число в кнопке читается как «шаг 87» без подписи']}
      >
        <TitlesPair folders={LIBRARY} config={{ counter: COUNTER_VIEW.BUTTON }} />
      </DemoSection>
    </Stack>
  );
}

export default CounterSection;
