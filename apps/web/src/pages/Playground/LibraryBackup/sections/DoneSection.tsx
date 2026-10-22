import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import CaptionedFrame from '../components/CaptionedFrame';
import DoneModal from '../components/DoneModal';
import { getResultStateLabel } from '../lib';
import { getMockResult } from '../mocks';
import { DONE_VIEW, RESULT_STATE, type DoneView } from '../models';

const STATES = [RESULT_STATE.AFTER_CONFLICTS, RESULT_STATE.NOTHING_ADDED, RESULT_STATE.SKIPPED];

type VariantProps = {
  view: DoneView;
};

function DoneVariant({ view }: VariantProps) {
  return (
    <Group align="flex-start" gap="lg">
      {STATES.map((state) => (
        <CaptionedFrame key={state} caption={getResultStateLabel(state)}>
          <DoneModal view={view} result={getMockResult(state)} />
        </CaptionedFrame>
      ))}
      <CaptionedFrame caption={`375 px · ${getResultStateLabel(RESULT_STATE.SKIPPED)}`}>
        <DoneModal view={view} result={getMockResult(RESULT_STATE.SKIPPED)} isPhone />
      </CaptionedFrame>
    </Group>
  );
}

/** D — шаг «Готово». */
function DoneSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="D"
        title="Шаг «Готово»"
        description="Тон success. Итог: добавлено закладок, перенесено в другие папки, создано папок, обновлено отметок, добавлено глав, применены ли настройки и что пропущено и почему. Три случая: после сводки с конфликтами («Взять из копии» и настройки), повторное восстановление того же файла и копия с чужого инстанса."
      />
      <DemoSection
        code="D1"
        title="Тем же видом, что сводка"
        description="Те же строки, что в S1, в прошедшем времени; пропущенное — отдельной строкой с причиной в заголовке."
        pros={[
          'Сводка и итог сверяются строка в строку',
          'Пропущенное стоит отдельно и не теряется среди добавленного',
        ]}
        cons={[
          'Длинно для «ничего не добавилось» — пять строк тире',
          'Если в сводке выбран не S1, это ещё один вид счётчиков',
        ]}
      >
        <DoneVariant view={DONE_VIEW.ROWS} />
      </DemoSection>
      <DemoSection
        code="D2"
        title="Коротко"
        description="Главная фраза «Добавлено …», под ней dimmed — только то, что легло не как в копии или не легло вовсе."
        pros={['Читается за секунду', 'Для «ничего не добавилось» — одна фраза']}
        cons={[
          'Перенос в другие папки и настройки теряются в абзаце',
          'Сверить со сводкой трудно: другой вид',
        ]}
      >
        <DoneVariant view={DONE_VIEW.SHORT} />
      </DemoSection>
      <DemoSection
        code="D3"
        title="D1 и пропущенное по источникам"
        description="Как D1, но под строкой «Пропущено» — по какому источнику сколько: видно, какой источник добавить на инстанс."
        pros={['При переезде понятно, чего не хватает на новом инстансе']}
        cons={[
          'В ответ API нужна разбивка по sourceId — в плане только счётчик',
          'Источник — голый sourceId: названия неизвестного инстансу источника взять неоткуда',
        ]}
      >
        <DoneVariant view={DONE_VIEW.BY_SOURCE} />
      </DemoSection>
    </Stack>
  );
}

export default DoneSection;
