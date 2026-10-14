import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { MOCK_SELECTIONS, SEL_DOWN, SEL_MULTPORN } from '../mocks';
import { BASE_LOOK, FEED_STATE, SINGLE_BLOCK } from '../models';

/** Список, где Senkuro лежит. */
const ENTRIES_WITH_DOWN = MOCK_SELECTIONS.map((entry) =>
  entry.source.id === SEL_DOWN.source.id ? SEL_DOWN : entry,
);

/** Ось Z — состояния открытого блока и источника в R1. */
function StatesSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Z"
        title="Загрузка, пусто, ошибки"
        description="Состояния в раскладке R1. У каждого блока теперь свой запрос: вкладки строятся из описания блоков источника и известны сразу, ждёт только сетка."
      />
      <DemoSection
        code="Z-load"
        title="Первая порция блока"
        description="Вкладки настоящие сразу, сетка — скелетоном карточек каталога. Ответ блока почти никогда не пустой, поэтому скелетон, а не спиннер."
        pros={['Переключаться между вкладками можно, пока блок грузится']}
        cons={['Каждая вкладка — свой запрос: первая загрузка на каждом переключении']}
      >
        <VariantFrames>
          <SelectionsMock look={BASE_LOOK} state={FEED_STATE.LOADING} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="Z-more"
        title="Следующая порция"
        description="Под сеткой Loader, как у бесконечной прокрутки каталога; окно прокручено к концу."
        pros={['Тот же вид, что в каталоге и ленте уведомлений']}
        cons={[]}
      >
        <VariantFrames>
          <SelectionsMock look={BASE_LOOK} state={FEED_STATE.LOADING_MORE} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="Z-empty"
        title="Пустой блок"
        description="Блок пришёл пустым — вкладка остаётся (вкладки известны до ответа), во вкладке EmptyState."
        pros={['Вкладки не прыгают после ответа']}
        cons={[
          'Можно открыть вкладку, в которой ничего нет; сейчас пустой блок просто не рисуется',
        ]}
      >
        <VariantFrames>
          <SelectionsMock look={BASE_LOOK} state={FEED_STATE.EMPTY} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="Z-down"
        title="Источник не ответил"
        description="Senkuro лежит: вкладок блоков нет, на их месте EmptyState с причиной, как сейчас. Селектор остаётся — выбрать другой источник."
        pros={['Не рисует вкладки, которые никуда не ведут']}
        cons={[]}
      >
        <VariantFrames>
          <SelectionsMock
            look={BASE_LOOK}
            entries={ENTRIES_WITH_DOWN}
            initialSourceId={SEL_DOWN.source.id}
          />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="Z1a"
        title="Один блок — одна вкладка"
        description="У MultPorn на главной один блок «Новое»: вкладка остаётся одна."
        pros={['Страница выглядит одинаково у всех источников']}
        cons={['Вкладка, которую не с чем переключать']}
      >
        <VariantFrames>
          <SelectionsMock look={BASE_LOOK} initialSourceId={SEL_MULTPORN.source.id} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="Z1b"
        title="Один блок — название вместо вкладок"
        description="Вкладок нет, вместо них иконка вида и название блока строкой."
        pros={['Нет переключателя без выбора']}
        cons={['Шапка меняет вид при смене источника']}
      >
        <VariantFrames>
          <SelectionsMock
            look={{ ...BASE_LOOK, singleBlock: SINGLE_BLOCK.LABEL }}
            initialSourceId={SEL_MULTPORN.source.id}
          />
        </VariantFrames>
      </DemoSection>
    </Stack>
  );
}

export default StatesSection;
