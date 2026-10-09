import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import ForcedListMode from '../components/ForcedListMode';
import SummaryResultsPage from '../components/SummaryResultsPage';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import {
  ANCHOR_STYLE,
  PHONE_TOOLBAR,
  PRESET_FILTERS,
  SECTION_SEPARATOR,
  TOOLBAR_LAYOUT,
  type Variant,
} from '../models';

const TOOLBAR_VARIANTS: Variant[] = [
  {
    code: 'G1',
    title: 'Вид рядом с «Фильтрами»',
    description:
      'Переключатель вида — сразу за кнопкой, пилюли — строкой ниже. Дыры между ними нет при любом числе пилюль.',
    pros: ['Все органы управления выдачей — в одном месте, у левого края'],
    cons: ['Расходится с каталогом, где вид у правого края'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage
          config={{ toolbarLayout: TOOLBAR_LAYOUT.NEXT_TO_FILTERS }}
          initialFilters={PRESET_FILTERS}
        />
      </VariantFrames>
    ),
  },
  {
    code: 'G2',
    title: 'Пилюли в середине строки',
    description:
      '«Фильтры», за ними пилюли, вид — у правого края, всё одной строкой. Снимите пилюли крестиком — останется та же дыра, что в G3.',
    pros: ['С выбранными фильтрами — одна строка вместо двух'],
    cons: [
      'Без фильтров дыра возвращается',
      'Много пилюль переносятся под кнопку — высота строки скачет',
    ],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage
          config={{ toolbarLayout: TOOLBAR_LAYOUT.PILLS_BETWEEN }}
          initialFilters={PRESET_FILTERS}
        />
      </VariantFrames>
    ),
  },
  {
    code: 'G3',
    title: 'Как в каталоге',
    description:
      'Как сейчас в итоге: вид прижат к правому краю, пилюли — строкой ниже. В каталоге между ними стоит сортировка, в поиске — пусто.',
    pros: ['Совпадает с каталогом'],
    cons: ['Между «Фильтрами» и видом — пустая полоса во всю ширину'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage
          config={{ toolbarLayout: TOOLBAR_LAYOUT.CATALOG }}
          initialFilters={PRESET_FILTERS}
        />
      </VariantFrames>
    ),
  },
];

const PHONE_VARIANTS: Variant[] = [
  {
    code: 'M1',
    title: '«Фильтры» растянута, вид справа',
    description:
      'Одна строка: кнопка занимает всё, что осталось от переключателя вида; пилюли — под ней.',
    pros: ['Крупная цель для пальца', 'Строка заполнена целиком, на строку короче итога'],
    cons: ['На десктопе кнопка другой ширины — но там и строка другая'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage
          config={{ phoneToolbar: PHONE_TOOLBAR.FILTERS_GROW }}
          initialFilters={PRESET_FILTERS}
        />
      </VariantFrames>
    ),
  },
  {
    code: 'M2',
    title: 'Обе по своей ширине',
    description: 'Кнопка «Фильтры» слева по своей ширине, вид — у правого края.',
    pros: ['Так же, как строка на десктопе в G3'],
    cons: ['Посередине пусто — та же дыра, только меньше'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage
          config={{ phoneToolbar: PHONE_TOOLBAR.SPACE_BETWEEN }}
          initialFilters={PRESET_FILTERS}
        />
      </VariantFrames>
    ),
  },
];

const ANCHOR_VARIANTS: Variant[] = [
  {
    code: 'C1',
    title: 'Обычное скругление',
    description:
      'Те же кнопки с логотипом и числом, что в H6c, но скругление — как у всех кнопок приложения.',
    pros: ['Видно, что это нажимается', 'Не выбивается из остальных кнопок'],
    cons: ['Рамки у каждого чипа — ряд выглядит плотнее'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage config={{ anchorStyle: ANCHOR_STYLE.DEFAULT }} />
      </VariantFrames>
    ),
  },
  {
    code: 'C2',
    title: 'Бейджи muted',
    description: 'Бейдж без рамки, с тонированным фоном: логотип, название, число.',
    pros: ['Легче на вид, ряд не спорит с заголовком'],
    cons: ['Меньше похоже на то, что можно нажать', 'Бейджи в приложении — метки, а не кнопки'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage config={{ anchorStyle: ANCHOR_STYLE.BADGE }} />
      </VariantFrames>
    ),
  },
  {
    code: 'C3',
    title: 'Пилюли muted',
    description: 'Тот же вид, что у пилюль в фильтрах, только без крестика.',
    pros: ['Мягкая форма, но без большого радиуса H6c'],
    cons: ['Легко принять за выбранные фильтры — они стоят строкой ниже'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage config={{ anchorStyle: ANCHOR_STYLE.PILL }} />
      </VariantFrames>
    ),
  },
];

const LIST_VARIANTS: Variant[] = [
  {
    code: 'V1',
    title: 'Три карточки и «Показать ещё»',
    description:
      'В виде «список» у каждого источника видно три карточки; «Показать ещё 7» раскрывает остальные уже пришедшие, «Свернуть» — обратно. Запроса к серверу нет.',
    pros: [
      'Все источники умещаются в пару экранов',
      'Три — обычно хватает, чтобы узнать нужный тайтл',
    ],
    cons: ['Если нужный тайтл четвёртый — лишний клик'],
    render: () => (
      <ForcedListMode>
        <VariantFrames>
          <SummaryResultsPage config={{ listPreview: 3 }} />
        </VariantFrames>
      </ForcedListMode>
    ),
  },
  {
    code: 'V2',
    title: 'Пять карточек и «Показать ещё»',
    description: 'То же, но сначала видно пять.',
    pros: ['Реже приходится раскрывать'],
    cons: ['Источник с 10 результатами — всё равно экран на телефоне'],
    render: () => (
      <ForcedListMode>
        <VariantFrames>
          <SummaryResultsPage config={{ listPreview: 5 }} />
        </VariantFrames>
      </ForcedListMode>
    ),
  },
];

const MISSED_VARIANTS: Variant[] = [
  {
    code: 'N5',
    title: 'N3 со строками N4',
    description:
      'Свёрнут — как N3: «Не ответили 4 источника» и «Повторить». Раскрыт — строки как в N4: логотип, название, причина справа, «Войти»; между строками — линии. Здесь раскрыт сразу.',
    pros: ['Компактно по умолчанию', 'Раскрытый читается столбиком, причины выровнены'],
    cons: ['Причины по-прежнему спрятаны, пока не раскроешь'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage config={{ withMissedRows: true }} isMissedOpened />
      </VariantFrames>
    ),
  },
];

const SEPARATOR_VARIANTS: Variant[] = [
  {
    code: 'R1',
    title: 'Тонкая линия',
    description: 'Divider между секциями, отступ вокруг него — как между блоками страницы.',
    pros: ['Граница видна, а выдача не становится длиннее'],
    cons: ['Линия рядом с лентой обложек почти теряется в тёмной теме'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage config={{ sectionSeparator: SECTION_SEPARATOR.DIVIDER }} />
      </VariantFrames>
    ),
  },
  {
    code: 'R2',
    title: 'Линия и больше воздуха',
    description: 'Тот же Divider, но отступ xl с обеих сторон.',
    pros: ['Источники разделены сильнее всего из линий'],
    cons: ['Выдача длиннее — на телефоне заметно'],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage config={{ sectionSeparator: SECTION_SEPARATOR.DIVIDER_WIDE }} />
      </VariantFrames>
    ),
  },
  {
    code: 'R3',
    title: 'Подложка без рамки',
    description: 'Каждая секция — на фоне поверхности со скруглением, без линий и рамок.',
    pros: ['Разделяет без линий, секции читаются блоками'],
    cons: [
      'Близко к отвергнутому S4, только без рамки',
      'Подложка съедает ширину ленты на телефоне',
    ],
    render: () => (
      <VariantFrames>
        <SummaryResultsPage config={{ sectionSeparator: SECTION_SEPARATOR.SURFACE }} />
      </VariantFrames>
    ),
  },
];

/** Доработки итога: каждая ось меняет в итоге одну вещь, остальное — как выбрано. */
function RefinementSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="G"
        title="Вид карточек на десктопе"
        description="Где переключатель вида относительно «Фильтров». Заранее выбраны «Манхва», «Маньхуа» и «Выходит», чтобы были видны пилюли."
      />
      <VariantList variants={TOOLBAR_VARIANTS} />
      <AxisHeading
        letter="M"
        title="Строка фильтров на телефоне"
        description="«Фильтры» и вид в одной строке — смотрите рамку 375 px. В итоге сейчас кнопка во всю ширину, а вид — отдельной строкой под пилюлями."
      />
      <VariantList variants={PHONE_VARIANTS} />
      <AxisHeading
        letter="C"
        title="Чипы «Нашлось на:»"
        description="В H6c у чипов скругление xl — здесь варианты помягче."
      />
      <VariantList variants={ANCHOR_VARIANTS} />
      <AxisHeading
        letter="V"
        title="«Показать ещё» в виде «список»"
        description="Здесь вид «список» включён всегда. В сетке «Показать ещё» нет — там лента, все 10 карточек и так доступны прокруткой."
      />
      <VariantList variants={LIST_VARIANTS} />
      <AxisHeading
        letter="N5"
        title="«Не ответили» строками N4"
        description="Блок N3, но раскрытое содержимое — строки мини-списка N4."
      />
      <VariantList variants={MISSED_VARIANTS} />
      <AxisHeading
        letter="R"
        title="Разделитель между источниками"
        description="Чем отделить одну секцию источника от другой."
      />
      <VariantList variants={SEPARATOR_VARIANTS} />
    </Stack>
  );
}

export default RefinementSection;
