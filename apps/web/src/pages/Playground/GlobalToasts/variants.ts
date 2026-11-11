import { RESULT_TEXT_SAMPLES } from './mocks';
import {
  ACCENT_STYLE,
  ACTION_LAYOUT,
  ACTION_STYLE,
  ACTION_SIZE,
  REVISED_RESULT_APPEARANCE,
  CONTENT_ALIGNMENT,
  RESULT_APPEARANCE,
  RESULT_TOAST_WIDTH,
  TITLE_WEIGHT,
  EVENT_HINT,
  TEXT_DENSITY,
  type AppearanceVariant,
} from './models';

export const FOOTER_SIZE_VARIANTS: AppearanceVariant[] = [
  {
    code: 'D5a',
    title: 'Футер с компактной кнопкой 30 px — выбран',
    description:
      'Выбранный футер D5 с нейтральной кнопкой справа: минимальная высота 30 px и уменьшенные боковые отступы. Текст кнопки остаётся 14 px. Вся комбинация уже собрана с одинаковым весом заголовков 600 и центрированием C1; полоса A1, отступы 16 px и стек S2 сохраняются.',
    pros: [
      'Компактнее D5 с кнопкой 36 px',
      'Цель нажатия крупнее, чем у D5b, при том же размере текста',
    ],
    cons: ['Кнопка выше и футер занимает больше места, чем в D5b'],
    appearance: { ...REVISED_RESULT_APPEARANCE, actionSize: ACTION_SIZE.COMPACT },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'D5b',
    title: 'Футер с маленькой кнопкой 26 px',
    description:
      'Та же собранная комбинация D5 + заголовки 600 + C1, но минимальная высота кнопки 26 px. Текст по-прежнему 14 px, иконка и нейтральная рамка сохраняются. Длинная подпись при нехватке места переносится целиком.',
    pros: [
      'Самый низкий футер среди D5, D5a и D5b',
      'Размер текста не уменьшается вместе с кнопкой',
    ],
    cons: ['Меньшая цель нажатия, особенно на телефоне'],
    appearance: { ...REVISED_RESULT_APPEARANCE, actionSize: ACTION_SIZE.DENSE },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'D5c',
    title: 'Mantine compact-xs — 22 px',
    description:
      'Встроенный size="compact-xs": высота 22 px, текст 12 px, горизонтальные отступы Mantine. Размер кнопки задан только через size, без h, mih, py или собственных стилей. Сохраняются футер D5, заголовки 600 и C1.',
    pros: ['Самая компактная встроенная кнопка в сравнении', 'Футер ниже, чем в D5d и D5e'],
    cons: ['Подпись мельче основного текста тоста', 'Самая маленькая цель нажатия'],
    appearance: { ...REVISED_RESULT_APPEARANCE, actionSize: ACTION_SIZE.NATIVE_XS },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'D5d',
    title: 'Mantine compact-sm — 26 px',
    description:
      'Встроенный size="compact-sm": высота 26 px и текст 14 px. Mantine задаёт всю геометрию и поведение подписи; размер не подгоняется вручную. Та же комбинация D5 + заголовки 600 + C1.',
    pros: ['Подпись того же размера, что текст тоста', 'Кнопка компактнее D5e и читабельнее D5c'],
    cons: ['Цель нажатия меньше, чем в D5e'],
    appearance: { ...REVISED_RESULT_APPEARANCE, actionSize: ACTION_SIZE.NATIVE_SM },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'D5e',
    title: 'Mantine compact-md — 30 px',
    description:
      'Встроенный size="compact-md": высота 30 px и текст 16 px. В отличие от прежнего D5a, здесь крупнее сам шрифт, а высота и отступы полностью определяются Mantine. Футер D5, заголовки 600 и C1 сохраняются.',
    pros: ['Самая крупная цель нажатия среди D5c–D5e', 'Крупнее и легче читается подпись'],
    cons: [
      'Подпись крупнее основного текста тоста',
      'Занимает больше ширины и высоты, чем D5c и D5d',
    ],
    appearance: { ...REVISED_RESULT_APPEARANCE, actionSize: ACTION_SIZE.NATIVE_MD },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
];

export const ACCENT_VARIANTS: AppearanceVariant[] = [
  {
    code: 'A1',
    title: 'Подложка иконки и тонкая полоса',
    description:
      'Тон читается в двух местах: на квадратной иконке и по короткой полосе у края. Фон карточки остаётся нейтральным.',
    pros: ['Тон заметен даже при быстром просмотре смешанного стека'],
    cons: ['Цветовой сигнал повторяется; стек выглядит активнее A2'],
    appearance: { accent: ACCENT_STYLE.STRIPE },
  },
  {
    code: 'A2',
    title: 'Только иконка с подложкой',
    description: 'Тон сосредоточен в одном небольшом элементе, остальная карточка спокойная.',
    pros: ['Меньше цветовых акцентов рядом с контентом'],
    cons: ['Разница между предупреждением и нейтральным сообщением менее заметна, чем в A1'],
    appearance: { accent: ACCENT_STYLE.ICON },
  },
];
export const TEXT_VARIANTS: AppearanceVariant[] = [
  {
    code: 'T1',
    title: 'Компактная карточка',
    description:
      'Отступы 12 px, заголовок подробного сообщения — 500. Однострочный результат остаётся обычным текстом без пустого пояснения.',
    pros: ['Три карточки занимают меньше высоты'],
    cons: ['Длинные заголовки и пояснения стоят плотнее, чем в T2'],
    appearance: { density: TEXT_DENSITY.COMPACT },
  },
  {
    code: 'T2',
    title: 'Больше воздуха и сильнее заголовок',
    description:
      'Отступы 16 px, заголовок подробного сообщения — 600. Размер текста по-прежнему 14; английский текст переносится без обрезки.',
    pros: ['Границы сообщений и заголовки легче различить'],
    cons: ['Стек с ошибкой и PWA выше; места для текста по ширине меньше'],
    appearance: { density: TEXT_DENSITY.RELAXED },
  },
  {
    code: 'T3',
    title: 'Одинаковый обычный вес — 400',
    description:
      'На выбранной базе A1 + T2 + D2 + S2 + I1 все основные сообщения имеют вес 400. Пояснение отличается только приглушённым цветом, наличие второй строки не меняет вес первой.',
    pros: [
      'Короткий результат и подробная ошибка выглядят последовательно',
      'Спокойнее T4 и прежних подробных заголовков T2',
    ],
    cons: ['Основная мысль слабее отделяется от пояснения, чем в T4'],
    appearance: { ...RESULT_APPEARANCE, titleWeight: TITLE_WEIGHT.REGULAR },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'T4',
    title: 'Одинаковый средний вес — 500',
    description:
      'На той же выбранной базе все основные сообщения имеют вес 500: и «Ссылка скопирована», и подробная ошибка. Пояснение остаётся обычным приглушённым текстом.',
    pros: [
      'Иерархия не зависит от наличия пояснения',
      'Основное сообщение легче выделить взглядом, чем в T3',
    ],
    cons: ['Короткие результаты заметнее, чем в T3'],
    appearance: { ...RESULT_APPEARANCE, titleWeight: TITLE_WEIGHT.MEDIUM },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'T5',
    title: 'Одинаковый полужирный вес — 600',
    description:
      'Все основные сообщения имеют вес 600, независимо от наличия пояснения: короткий результат, событие, отмена и предложение PWA. Пояснения остаются обычным приглушённым текстом 14 px. Отступы — 16 px, как в T2.',
    pros: ['Единый вес всех заголовков', 'Основное сообщение заметнее, чем в T3 и T4'],
    cons: ['Длинные заголовки получают больший визуальный вес'],
    appearance: { ...RESULT_APPEARANCE, titleWeight: TITLE_WEIGHT.SEMIBOLD },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
];
export const ACTION_VARIANTS: AppearanceVariant[] = [
  {
    code: 'D1',
    title: 'Рядом, когда помещается',
    description:
      'У короткого сообщения кнопка делит строку с текстом. На узкой ширине переносится целиком. У подробного сообщения действие всегда под пояснением.',
    pros: ['Короткие отмены на десктопе ниже, чем в D2'],
    cons: ['Положение кнопки зависит от ширины и длины перевода'],
    appearance: { actionLayout: ACTION_LAYOUT.ADAPTIVE },
    width: 420,
  },
  {
    code: 'D2',
    title: 'Действие всегда снизу',
    description:
      'Кнопка начинает отдельную строку под текстом: одинаковое правило для возврата закладки, возврата тайтла и PWA.',
    pros: ['Положение предсказуемо в обеих ширинах'],
    cons: ['Даже короткая отмена получает дополнительную строку'],
    appearance: { actionLayout: ACTION_LAYOUT.BELOW },
    width: 420,
  },
  {
    code: 'D3',
    title: 'Вторичная кнопка с нейтральной рамкой',
    description:
      'На выбранной базе A1 + T2 + D2 + S2 + I1 действие остаётся под текстом, но получает обычную кнопку с нейтральной рамкой и минимальной высотой 36 px. Длинная подпись переносится при нехватке ширины. Цвет тоста не превращает её в опасную кнопку.',
    pros: [
      'Действие отчётливо выглядит кнопкой',
      'Более крупная цель нажатия, чем у текущего compact-sm',
    ],
    cons: ['Кнопка заметнее прежней ссылки и увеличивает высоту карточки'],
    appearance: { ...RESULT_APPEARANCE, actionStyle: ACTION_STYLE.DEFAULT },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'D4',
    title: 'Кнопка с мягким акцентным фоном',
    description:
      'Та же кнопка с минимальной высотой 36 px и переносом подписи под текстом, но в варианте muted: мягкий акцентный фон и рамка. Иконка и предметная подпись сохраняются.',
    pros: ['Действие легче найти, чем в D3', 'Мягче сплошной яркой заливки кнопки'],
    cons: ['Добавляет цвет рядом с полосой и предметной иконкой'],
    appearance: { ...RESULT_APPEARANCE, actionStyle: ACTION_STYLE.MUTED },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'D5',
    title: 'Отдельный футер, кнопка справа',
    description:
      'Действие вынесено из текстовой колонки: тонкий разделитель на внутреннюю ширину карточки, затем обычная кнопка с нейтральной рамкой справа. Без действия футер не появляется.',
    pros: ['Действие отделено от сообщения', 'У кнопки своё устойчивое место по правому краю'],
    cons: ['Самая высокая карточка из D3–D5', 'Разделитель добавляет визуальную границу'],
    appearance: { ...RESULT_APPEARANCE, actionStyle: ACTION_STYLE.FOOTER },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  ...FOOTER_SIZE_VARIANTS,
];
export const INTERACTION_VARIANTS: AppearanceVariant[] = [
  {
    code: 'I1',
    title: 'Подсветка при наведении и контур фокуса',
    description:
      'Событие открывается всей карточкой. Контур появляется при переходе Tab, крестик закрывает только тост. Обычные сообщения не получают ложную кликабельность.',
    pros: ['Никаких дополнительных значков возле текста'],
    cons: ['До наведения переход по карточке неочевиден'],
    appearance: { eventHint: EVENT_HINT.HOVER },
  },
  {
    code: 'I2',
    title: 'Постоянная стрелка перехода',
    description:
      'У событий дополнительно видна стрелка. У результата действия и тостов с отдельной кнопкой её нет; поведение фокуса и крестика такое же, как в I1.',
    pros: ['Событие отличается от обычного сообщения ещё до наведения'],
    cons: ['Стрелка занимает ширину и усиливает переносы длинных заголовков'],
    appearance: { eventHint: EVENT_HINT.ARROW },
  },
];

export const ALIGNMENT_VARIANTS: AppearanceVariant[] = [
  {
    code: 'C1',
    title: 'Центрировать только простое сообщение',
    description:
      'На выбранной базе у тоста без пояснения и действия иконка, текст и крестик выровнены по вертикальному центру. Текст может переноситься; подробные сообщения и тосты с кнопкой сохраняют прежнюю раскладку.',
    pros: [
      'Исправляет смещение однострочного результата',
      'Подробные карточки сохраняют прежнюю высоту',
    ],
    cons: [
      'Два правила выравнивания в зависимости от содержимого',
      'Заголовок тоста с действием остаётся у верхнего края',
    ],
    appearance: { ...RESULT_APPEARANCE, contentAlignment: CONTENT_ALIGNMENT.SIMPLE_CENTER },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
  {
    code: 'C2',
    title: 'Общая верхняя строка для всех тостов',
    description:
      'Иконка, заголовок и крестик образуют одну верхнюю строку и выровнены по её центру. Пояснение и кнопка идут ниже в текстовой колонке. Длинный заголовок увеличивает верхнюю строку целиком.',
    pros: [
      'Одинаковый принцип для коротких и подробных сообщений',
      'Однострочный заголовок совпадает с центром иконки даже при наличии кнопки',
    ],
    cons: [
      'Короткие заголовки с пояснением увеличивают высоту карточки',
      'При многострочном заголовке иконка центрируется относительно всего заголовка',
    ],
    appearance: { ...RESULT_APPEARANCE, contentAlignment: CONTENT_ALIGNMENT.HEADER },
    width: RESULT_TOAST_WIDTH,
    samples: RESULT_TEXT_SAMPLES,
  },
];
