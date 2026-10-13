import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import CurrentSelectionsMock from '../components/CurrentSelectionsMock';
import SelectionsMock from '../components/SelectionsMock';
import SourceTabsMock from '../components/SourceTabsMock';
import { BASE_LOOK } from '../models';

/** Ось R — какой уровень вкладками, какой селектором. */
function LayoutSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="R"
        title="Что вкладки, что селектор"
        description="Источник и блок — два уровня выбора. Один из них становится вкладками, второй прячется в селектор; открытый блок занимает страницу сеткой и листается порциями."
      />
      <DemoSection
        code="R0"
        title="Как сейчас"
        description="Чипы источников, у выбранного все блоки лентами друг под другом. В каждой ленте только то, что лежит на главной сайта."
        pros={['Все блоки источника видны одной прокруткой', 'Нет второго уровня переключателей']}
        cons={[
          'Блок не продолжить: 10–25 тайтлов, и всё',
          'У Реманги и MangaLib по шесть лент — нужный блок ищется прокруткой',
          'Ленты обложек не переключаются на список',
        ]}
      >
        <VariantFrames>
          <CurrentSelectionsMock />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="R1"
        title="Источник — селектор, блоки — вкладки"
        description="Источник выбирается заголовком-кнопкой (форма — ось S), блоки — вкладками с иконкой вида. Открытый блок — сетка каталога; у листаемых блоков следующая порция подгружается при прокрутке. Листайте «Горячие новинки» или «Свежие главы»."
        pros={[
          'На виду один ряд переключателей — блоки, а их всего 1–6',
          'Блок занимает страницу и листается дальше главной сайта',
          'Сетка и список, как в каталоге',
        ]}
        cons={[
          'Другие источники видны только в открытом списке',
          'Блоки не сравнить одним взглядом — по вкладке за раз',
        ]}
      >
        <VariantFrames>
          <SelectionsMock look={BASE_LOOK} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="R2"
        title="Источники — вкладки, блок — селектор"
        description="Наоборот: источники вкладками с логотипами, блок выбирается полем над сеткой. Сетка и подгрузка — те же, что в R1."
        pros={['Источники видны сразу, как чипы сейчас', 'Смена источника — один клик']}
        cons={[
          'Десять–двадцать вкладок-источников на телефоне уходят далеко вбок',
          'Блоки — самое интересное на странице — спрятаны в список',
          'Поле с названием блока выглядит фильтром, а не разделом',
        ]}
      >
        <VariantFrames>
          <SourceTabsMock />
        </VariantFrames>
      </DemoSection>
    </Stack>
  );
}

export default LayoutSection;
