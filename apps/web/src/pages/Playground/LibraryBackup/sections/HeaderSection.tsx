import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import SummaryVariant from '../components/SummaryVariant';
import { HEADER_VIEW, SUMMARY_STATE } from '../models';

const STATES = [SUMMARY_STATE.CONFLICTS, SUMMARY_STATE.UNKNOWN_SOURCES];

/** H — чья копия и откуда. */
function HeaderSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="H"
        title="Чья копия и откуда"
        description="Копию чужого аккаунта или другого инстанса загружать можно — поэтому сверху видно, чья она и откуда. Справа — копия с длинным логином и адресом: они переносятся, а не обрезаются."
      />
      <DemoSection
        code="H1"
        title="Главной фразой"
        description="«Копия gabageba от 12 октября 2026 г.» — главная фраза 14, адрес инстанса под ней моноширинным dimmed."
        pros={[
          'Обычная иерархия модалки: фраза, потом пояснение',
          'Дата словами читается как речь',
        ]}
        cons={['Две строки и кнопка над счётчиками — сводка начинается ниже']}
      >
        <SummaryVariant states={STATES} phoneState={SUMMARY_STATE.UNKNOWN_SOURCES} />
      </DemoSection>
      <DemoSection
        code="H2"
        title="Карточка файла"
        description="Рамка с именем файла, логином, датой, адресом и размером — видно, какой именно файл выбран."
        pros={[
          'Имя файла на виду — легко заметить, что выбран не тот',
          'Всё о файле в одном месте',
        ]}
        cons={[
          'Рамка в теле модалки — на грани правила «без боксов»',
          'Имя файла и дата в нём повторяют друг друга',
          'Самая высокая шапка',
        ]}
      >
        <SummaryVariant
          layout={{ header: HEADER_VIEW.CARD }}
          states={STATES}
          phoneState={SUMMARY_STATE.UNKNOWN_SOURCES}
        />
      </DemoSection>
      <DemoSection
        code="H3"
        title="Дата в заголовке модалки"
        description="Заголовок шага — «Копия от 12 октября 2026 г.», как «Закладки на X» в импорте с источника; логин и адрес — строкой под ним."
        pros={['Не тратит высоту тела', 'Как шаг тайтлов в «Импорте из источника»']}
        cons={[
          'Заголовок перестаёт называть действие — «Восстановить» видно только на кнопке',
          'На телефоне заголовок с датой переносится в две строки',
        ]}
      >
        <SummaryVariant
          layout={{ header: HEADER_VIEW.TITLE }}
          states={STATES}
          phoneState={SUMMARY_STATE.UNKNOWN_SOURCES}
        />
      </DemoSection>
    </Stack>
  );
}

export default HeaderSection;
