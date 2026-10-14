import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import HeaderStates from '../components/HeaderStates';
import { HEADER_HIGHLIGHT, HEADER_HOME, type HeaderHighlight, type HeaderHome } from '../models';

const VARIANTS: {
  code: string;
  variant: HeaderHome;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}[] = [
  {
    code: 'H0',
    variant: HEADER_HOME.NONE,
    title: 'Как сейчас',
    description:
      'Отдельной кнопки нет; на главную ведёт только логотип (сейчас он ведёт в /sources).',
    pros: ['шапка не меняется'],
    cons: [
      'логотип как ссылку угадывают не все — ради этого в плане и заведена кнопка',
      'на главной ничего не подсвечено: не видно, где ты',
    ],
  },
  {
    code: 'H1',
    variant: HEADER_HOME.ICON_RIGHT,
    title: 'Домик справа, первым',
    description:
      'ActionIcon с HouseIcon и тултипом «Главная» перед закладками и колокольчиком. На / — подсвечен и залит.',
    pros: [
      'тот же набор и порядок, что в нижней панели телефона: главная, …, закладки, уведомления',
      'шапка не становится шире',
    ],
    cons: [
      'навигация смешана с действиями справа',
      'далеко от логотипа и выбора источника — двух других путей «наверх»',
    ],
  },
  {
    code: 'H2',
    variant: HEADER_HOME.BUTTON_LEFT,
    title: 'Кнопка с подписью слева',
    description:
      '«Главная» с иконкой между логотипом и выбором источника: навигация слева, действия справа.',
    pros: ['самая заметная — подписана словом', 'навигация собрана слева в одном месте'],
    cons: [
      'рядом с логотипом, который ведёт туда же, — два одинаковых пути подряд',
      'съедает ширину у поиска на узком десктопе',
    ],
  },
  {
    code: 'H3',
    variant: HEADER_HOME.ICON_LEFT,
    title: 'Домик слева',
    description: 'Та же иконка, что в H1, но между логотипом и выбором источника.',
    pros: ['компактно, навигация слева'],
    cons: [
      'логотип и домик подряд — две иконки, ведущие в одно место',
      'расходится с порядком нижней панели только местом, а не составом',
    ],
  },
  {
    code: 'H4',
    variant: HEADER_HOME.TABS,
    title: 'Пункты навигации',
    description:
      '«Главная» и выбор источника — одинаковые пункты без рамки, активный подчёркнут акцентной линией по низу шапки.',
    pros: ['явно видно, в каком разделе ты', 'главная и источники — равноправные разделы'],
    cons: [
      'меняет и вид выбора источника — шире задачи',
      'подчёркивание — новый для приложения приём в шапке',
    ],
  },
];

const HIGHLIGHTS: {
  code: string;
  highlight: HeaderHighlight;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}[] = [
  {
    code: 'H3a',
    highlight: HEADER_HIGHLIGHT.LIGHT,
    title: 'Подложка и заливка',
    description:
      'Иконка своей страницы — на светлой акцентной подложке (variant="light") и залитая. Так же у главной, закладок и уведомлений.',
    pros: [
      'заметно с первого взгляда — кнопка как будто нажата',
      'тот же приём, что у активной кнопки нижней панели (light)',
    ],
    cons: ['подложка тяжелее остального в шапке — особенно рядом с аватаром'],
  },
  {
    code: 'H3b',
    highlight: HEADER_HIGHLIGHT.FILL,
    title: 'Только цвет и заливка',
    description:
      'Без подложки: иконка своей страницы акцентного цвета и залитая, остальные — серые контурные.',
    pros: ['шапка не меняет вес ни на одной странице'],
    cons: [
      'залитая иконка 20 px — слабый признак, на светлой теме легко не заметить',
      'у главной домик рядом с лапкой-логотипом того же цвета — сливаются',
    ],
  },
  {
    code: 'H3c',
    highlight: HEADER_HIGHLIGHT.LINE,
    title: 'Линия по низу шапки',
    description:
      'Под иконкой своей страницы — акцентная линия, лежащая на нижней границе шапки; иконка залита и окрашена.',
    pros: ['видно издалека, сама кнопка не тяжелеет'],
    cons: [
      'новый для приложения приём, нигде больше линий нет',
      'линия под узкой иконкой короткая и легко теряется',
    ],
  },
];

/** Ось H — кнопка «Главная» в шапке на десктопе. */
function HeaderSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="H"
        title="Кнопка «Главная» в шапке"
        description="Только десктоп: на телефоне «Главная» — в нижней панели (ось B). H0–H4 — на главной и в каталоге Реманги; подварианты H3a–H3c — ещё на закладках и уведомлениях: как выделена иконка своей страницы."
      />
      {VARIANTS.map(({ code, variant, title, description, pros, cons }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <HeaderStates variant={variant} />
        </DemoSection>
      ))}
      {HIGHLIGHTS.map(({ code, highlight, title, description, pros, cons }) => (
        <DemoSection
          key={code}
          code={code}
          title={`H3: ${title}`}
          description={description}
          pros={pros}
          cons={cons}
        >
          <HeaderStates variant={HEADER_HOME.ICON_LEFT} highlight={highlight} withIconPages />
        </DemoSection>
      ))}
    </Stack>
  );
}

export default HeaderSection;
