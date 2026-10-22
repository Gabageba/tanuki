import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import SummaryVariant from '../components/SummaryVariant';
import { SUMMARY_STATE } from '../models';

const STATES = [SUMMARY_STATE.NO_CONFLICTS, SUMMARY_STATE.CONFLICTS];

/** T — тон сводки и путь назад к файлу: стрелка встаёт на место иконки тона. */
function ToneSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="T"
        title="Тон и путь назад"
        description="По правилу ToneModal стрелка «назад» встаёт на место иконки тона — и тогда переход neutral → warning на сводке не видно. Слева сводка без конфликтов (neutral), справа — с конфликтами: по плану «Дальше прочитанное» уже сдвигает 3 отметки вперёд, поэтому она открывается золотой. Переключите ответы — тон меняется. В остальных осях сводка показана в T1."
      />
      <DemoSection
        code="T1"
        title="Без стрелки, «Выбрать другой файл» у шапки"
        description="Иконка тона всегда на месте; вернуться к файлу — кнопкой под «чья копия»."
        pros={[
          'Тон виден ровно там, где он меняется',
          'Путь назад назван словами — понятно, что вернёт к выбору файла',
        ]}
        cons={[
          'Внутренний шаг без стрелки — расходится с «Импортом из источника» и правилом ToneModal',
          'Ещё одна кнопка в теле модалки',
        ]}
      >
        <SummaryVariant states={STATES} phoneState={SUMMARY_STATE.CONFLICTS} />
      </DemoSection>
      <DemoSection
        code="T2"
        title="Стрелка в заголовке, тон только советом"
        description="Как в плане и в «Импорте из источника»: стрелка вместо иконки. О замене говорит только совет скачать копию (ось W)."
        pros={['Как остальные многошаговые модалки', 'В теле нет лишней кнопки']}
        cons={[
          'Переход в warning иконкой не виден вовсе — весь вес на совете',
          'Нейтральная и предупреждающая сводки выглядят одинаково до появления совета',
        ]}
      >
        <SummaryVariant
          layout={{ withBack: true }}
          states={STATES}
          phoneState={SUMMARY_STATE.CONFLICTS}
        />
      </DemoSection>
    </Stack>
  );
}

export default ToneSection;
