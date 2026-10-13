import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { MOCK_SELECTIONS, SEL_MANGALIB, SEL_MANGALIB_MERGED } from '../mocks';
import { DRAFT_LOOK, PERIOD_PICKER, type MockSelectionsSource, type PeriodPicker } from '../models';

/** P3 — тот же список, но у MangaLib три «Сейчас читают» слиты в одну вкладку. */
const ENTRIES_MERGED: MockSelectionsSource[] = MOCK_SELECTIONS.map((entry) =>
  entry.source.id === SEL_MANGALIB.source.id ? SEL_MANGALIB_MERGED : entry,
);

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  period: PeriodPicker;
};

const VARIANTS: Variant[] = [
  {
    code: 'P0',
    title: 'Как сейчас — без периода',
    description:
      'Три вкладки «Сейчас читают: …», период — тот, что сайт отдаёт на главной по умолчанию.',
    pros: ['Ничего нового в шапке'],
    cons: ['За неделю и за месяц не посмотреть — а на сайте это есть'],
    period: PERIOD_PICKER.NONE,
  },
  {
    code: 'P1',
    title: 'Период над сеткой',
    description:
      'У трёх вкладок «Сейчас читают» между вкладками и сеткой — «За день | За неделю | За месяц». Смена периода перезагружает сетку.',
    pros: [
      'Период виден сразу и меняется одним нажатием',
      'Шесть вкладок остаются как в настройках',
    ],
    cons: ['Ряд появляется только у трёх вкладок — шапка прыгает при переключении'],
    period: PERIOD_PICKER.SEGMENTED,
  },
  {
    code: 'P2',
    title: 'Период полем рядом с «Каталог»',
    description:
      'Поле «За день» с календарём встаёт в строку источника слева от «Каталог: …», только у вкладок «Сейчас читают».',
    pros: ['Высота шапки не меняется'],
    cons: [
      'Поле легко не заметить — оно далеко от вкладки, к которой относится',
      'На телефоне строка переносится',
    ],
    period: PERIOD_PICKER.SELECT,
  },
  {
    code: 'P3',
    title: 'Одна вкладка «Сейчас читают» с двумя переключателями',
    description:
      'Как на сайте: одна вкладка, внутри «Новинки | Набирающее популярность | Популярное» и период. У MangaLib четыре вкладки вместо шести.',
    pros: ['Короткие названия вкладок, их меньше', 'Повторяет устройство сайта'],
    cons: [
      'Два ряда переключателей над сеткой',
      'Три блока сливаются в один: в настройках у «Сейчас читают» одна галочка вместо трёх, сохранённый выбор придётся перенести',
    ],
    period: PERIOD_PICKER.MERGED,
  },
];

/** Ось P — период у «Сейчас читают» MangaLib; показано на выбранной комбинации. */
function PeriodSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="P"
        title="Период «Сейчас читают»"
        description="У MangaLib «Сейчас читают» на сайте переключается за день, неделю и месяц (/media/top-views?time=…). Показано на выбранной комбинации, открыта вкладка «Сейчас читают»; переключите период — придут другие тайтлы."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, period }) => {
        const isMerged = period === PERIOD_PICKER.MERGED;
        return (
          <DemoSection
            key={code}
            code={code}
            title={title}
            description={description}
            pros={pros}
            cons={cons}
          >
            <VariantFrames>
              <SelectionsMock
                look={{ ...DRAFT_LOOK, period }}
                entries={isMerged ? ENTRIES_MERGED : MOCK_SELECTIONS}
                initialSourceId={SEL_MANGALIB.source.id}
                initialBlockId={isMerged ? 'readingNow' : 'readingNowNew'}
              />
            </VariantFrames>
          </DemoSection>
        );
      })}
    </Stack>
  );
}

export default PeriodSection;
