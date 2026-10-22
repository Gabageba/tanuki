import { Stack } from '@mantine/core';
import { UploadSimpleIcon } from '@phosphor-icons/react';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import ModalFrame from '../../components/ModalFrame';
import CaptionedFrame from '../components/CaptionedFrame';
import CurrentImportForm from '../components/CurrentImportForm';
import SummaryVariant from '../components/SummaryVariant';
import { MOCK_FILE } from '../mocks';
import { COUNTERS_VIEW, SUMMARY_STATE } from '../models';

const STATES = [
  SUMMARY_STATE.CONFLICTS,
  SUMMARY_STATE.NO_CONFLICTS,
  SUMMARY_STATE.NOTHING_NEW,
  SUMMARY_STATE.UNKNOWN_SOURCES,
];

/** S — счётчики сводки. */
function CountersSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="Счётчики сводки"
        description="Что в копии и как ляжет: закладки (новых, уже есть, в другой папке, пропущено), папки (новых, совпали по имени, сверх лимита), «где остановился» (новых, расходятся), главы статистики, настройки. Четыре состояния: с конфликтами, без них, «всё уже есть» (повторное восстановление) и копия с чужого инстанса, где почти все источники неизвестны, а 3 папки не помещаются в лимит."
      />
      <DemoSection
        code="S0"
        title="Как сейчас"
        description="ProgressList по встроенным папкам — мок, который не зависит от файла."
        cons={[
          'Только закладки — ни прогресса, ни статистики, ни настроек',
          'Не видно, что уже есть и что пропустится',
          'Полосам нечего сравнивать: длина — доля папки, а не что-то про восстановление',
        ]}
      >
        <CaptionedFrame caption="Файл выбран">
          <ModalFrame title="Импорт закладок" tone={MODAL_TONE.NEUTRAL} icon={UploadSimpleIcon}>
            <CurrentImportForm file={MOCK_FILE} />
          </ModalFrame>
        </CaptionedFrame>
      </DemoSection>
      <DemoSection
        code="S1"
        title="Строки GroupedList"
        description="Часть копии — строка с иконкой; сколько новых — справа моноширинным, всё остальное — описанием строки. Ноль — тире."
        pros={[
          'Тот же вид, что блок в профиле, откуда модалка открылась',
          'Каждая часть отдельно — «пропущено» стоит у своей части',
          'На телефоне не тесно: число справа, описание переносится',
        ]}
        cons={[
          'Самый высокий вариант — с вопросами модалка на телефоне прокручивается',
          '«Уже есть» и «пропущено» — мелким текстом, сравнивать их между частями трудно',
        ]}
      >
        <SummaryVariant states={STATES} phoneState={SUMMARY_STATE.CONFLICTS} />
      </DemoSection>
      <DemoSection
        code="S2"
        title="Таблица «Добавится / Уже есть / Пропущено»"
        description="Части — строками, исходы — столбцами; пустые ячейки — тире. Что значит «уже есть» и «пропущено» у каждой части — пояснениями под таблицей."
        pros={['Числа выровнены по столбцам — сравниваются сразу', 'Компактнее S1 по высоте']}
        cons={[
          '«Уже есть» и «Пропущено» значат у частей разное — без пояснений таблица врёт',
          'На 375 px столбцы впритык',
          'Настройки в таблицу не ложатся — уходят в пояснение',
        ]}
      >
        <SummaryVariant
          layout={{ counters: COUNTERS_VIEW.TABLE }}
          states={STATES}
          phoneState={SUMMARY_STATE.CONFLICTS}
        />
      </DemoSection>
      <DemoSection
        code="S3"
        title="Компактный текст"
        description="Главная фраза «Добавится …», под ней dimmed — что уже есть и что пропущено."
        pros={[
          'Самый короткий — вопросы видны без прокрутки',
          'Читается как обычная фраза модалки',
        ]}
        cons={[
          'Числа не выстроены — чтобы найти «пропущено», фразу надо дочитать',
          'Длинные перечисления на телефоне превращаются в абзац',
        ]}
      >
        <SummaryVariant
          layout={{ counters: COUNTERS_VIEW.TEXT }}
          states={STATES}
          phoneState={SUMMARY_STATE.CONFLICTS}
        />
      </DemoSection>
    </Stack>
  );
}

export default CountersSection;
