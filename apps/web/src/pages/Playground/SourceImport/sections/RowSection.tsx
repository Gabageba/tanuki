import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import TitlesPair from '../components/TitlesPair';
import { LIBRARY_PREVIEW } from '../mocks';
import { ROW_VIEW } from '../models';

/** R — раскладка строки тайтла. */
function RowSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="R"
        title="Строка тайтла"
        description="Название, бейдж нашей папки, «Гл. 42» и подпись «Уже в закладках…» — и как это помещается на 375 px. Короткая выборка: длинное название, тайтл без главы, копия в группе, конфликт папки, уже импортированные. Остальное — база L1 + K1 + A1 + P0 + M1."
      />
      <DemoSection
        code="R1"
        title="В одну линию"
        description="Название слева обрезается, справа «Гл. 42» и бейдж папки; подпись про закладки — второй строкой, только если есть."
        pros={[
          'Самая плотная строка — больше тайтлов на экране',
          'Номера глав стоят в колонку и сравниваются',
        ]}
        cons={[
          'На телефоне длинное название сжимается до пары слов',
          'Длинное имя папки съедает место у названия',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ row: ROW_VIEW.ONE_LINE }} />
      </DemoSection>
      <DemoSection
        code="R2"
        title="В две линии"
        description="Название целиком, под ним бейдж и «Гл. 42», ниже — подпись про закладки."
        pros={[
          'Название не обрезается ни на какой ширине',
          'Бейдж и глава не спорят с названием за место',
        ]}
        cons={['Строка выше — на экране меньше тайтлов', 'Главы не выстроены в колонку']}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ row: ROW_VIEW.TWO_LINES }} />
      </DemoSection>
      <DemoSection
        code="R3"
        title="Две линии и обложка"
        description="R2 с маленькой обложкой из снимка сайта слева — тайтл узнают по картинке, а не по названию."
        pros={[
          'Тайтл узнают с первого взгляда, особенно с похожими названиями',
          'Выглядит как библиотека, а не как форма',
        ]}
        cons={[
          'Сотня обложек — сотня запросов к картинкам на шаге выбора',
          'Строка ещё выше, чем в R2',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ row: ROW_VIEW.COVER }} />
      </DemoSection>
    </Stack>
  );
}

export default RowSection;
