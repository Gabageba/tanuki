import { useState } from 'react';
import { Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import AxisHeader from '../UsersAdmin/components/AxisHeader';
import VariantPreview from './components/VariantPreview';
import { FOCUS_LISTS, LOOK_LISTS } from './mocks';
import { OPTION_FOCUS, OPTION_LOOK, type OptionLook, type Variant } from './models';

const FINAL_VARIANT: Variant = {
  code: 'O1 + K0',
  title: 'Итог',
  description:
    'Вид выбранного пункта прежний — заливка, рамка, акцентный текст и галочка, — но между всеми пунктами списка зазор 4px, как у плиток выбора источника в шапке. Курсор клавиатуры оформлен как сейчас — так же, как выбор. Один вид на Select, MultiSelect и сортировку каталога.',
  pros: [
    'Выбранные подряд больше не слипаются: у каждого целая рамка',
    'Списки выглядят так же, как переключатель источников в шапке',
    'Правка — одно правило для списка в теме, вид пункта не меняется',
  ],
  cons: [
    'Список длиннее на 4px на пункт',
    'Невыбранный пункт под курсором клавиатуры по-прежнему выглядит выбранным, только без галочки',
  ],
  look: OPTION_LOOK.GAP,
  focus: OPTION_FOCUS.CURRENT,
};

const FINAL_LISTS = [...LOOK_LISTS.slice(0, 3), ...FOCUS_LISTS.slice(0, 1)];

const LOOK_VARIANTS: Variant[] = [
  {
    code: 'O0',
    title: 'Как сейчас',
    description:
      'У каждого выбранного пункта своя заливка, рамка и скругление, а Mantine ставит пункты вплотную. В Select выбран один пункт, и это не мешало; в MultiSelect выбранные идут подряд.',
    pros: ['Выбранный пункт в одиночном Select заметен сразу'],
    cons: [
      'Выбранные подряд слипаются в стопку: рамки касаются, скругления встречаются углами',
      'Чем больше выбрано, тем больше список похож на один толстый блок с полосами',
    ],
    look: OPTION_LOOK.CURRENT,
    focus: OPTION_FOCUS.CURRENT,
  },
  {
    code: 'O1',
    title: 'Зазор 4px',
    description:
      'Вид пункта прежний, но между всеми пунктами зазор 4px — как между плитками выбора источника в шапке. Каждый выбранный — отдельная плашка.',
    pros: [
      'Выбранные подряд не касаются, у каждого целая рамка',
      'Списки выглядят так же, как переключатель источников в шапке',
      'Правка — одно правило для списка, вид пункта не меняется',
    ],
    cons: [
      'Список длиннее на 4px на пункт: из девяти жанров на экран без скролла влезает меньше',
      'Четыре выбранных подряд — всё ещё четыре обведённые плашки, ярко',
    ],
    look: OPTION_LOOK.GAP,
    focus: OPTION_FOCUS.CURRENT,
  },
  {
    code: 'O2',
    title: 'Сплошной блок',
    description:
      'Выбранные подряд срастаются в одну плашку: внешняя рамка и скругления только у краёв группы, внутри — тонкие разделители. Одиночный выбранный выглядит как сейчас.',
    pros: [
      'Подряд выбранные читаются как одна группа, без двойных рамок',
      'Высота списка не меняется',
    ],
    cons: [
      'Плашки разной высоты: при выборе через один и подряд список выглядит по-разному',
      'Стили на соседних селекторах (:has, +) — хрупко, если в списке появятся группы',
    ],
    look: OPTION_LOOK.MERGED,
    focus: OPTION_FOCUS.CURRENT,
  },
  {
    code: 'O3',
    title: 'Без рамки',
    description:
      'Выбранный пункт — заливка цветом акцента, акцентный текст и галочка, рамки нет. Соседние выбранные сливаются в общую подложку, но стыков не видно.',
    pros: [
      'Нечему стыковаться: подряд выбранные — ровная полоса заливки',
      'Ближе к стандартному Mantine, высота списка прежняя',
    ],
    cons: [
      'Расходится с плитками шапки, где у выбранного рамка',
      'Границы между выбранными подряд не видно — считать их приходится по галочкам',
    ],
    look: OPTION_LOOK.FLAT,
    focus: OPTION_FOCUS.CURRENT,
  },
  {
    code: 'O4',
    title: 'Только галочка',
    description:
      'Без заливки и рамки: выбранный пункт отличается акцентным цветом текста и галочкой справа.',
    pros: [
      'Самый спокойный длинный список: выделение не спорит с наведением',
      'Подряд выбранные ничем не стыкуются',
    ],
    cons: [
      'Выбор держится на цвете текста и галочке — хуже заметен краем глаза',
      'Сильнее всех расходится с шапкой и с Select, к которому привыкли',
    ],
    look: OPTION_LOOK.CHECK,
    focus: OPTION_FOCUS.CURRENT,
  },
];

const FOCUS_VARIANTS: Variant[] = [
  {
    code: 'K0',
    title: 'Как сейчас',
    description:
      'Пункт под курсором клавиатуры получает тот же стиль, что выбранный: Mantine отмечает его атрибутом data-combobox-selected, а global.scss оформляет этот атрибут как выбор.',
    pros: ['Ничего не надо менять'],
    cons: [
      'Невыбранный пункт под курсором выглядит выбранным, только без галочки',
      'На выбранном пункте курсора не видно вовсе — непонятно, что снимет Enter',
    ],
    look: OPTION_LOOK.GAP,
    focus: OPTION_FOCUS.CURRENT,
  },
  {
    code: 'K1',
    title: 'Фокус как наведение',
    description:
      'Курсор клавиатуры подсвечивается так же, как пункт под мышью: серым у невыбранного и более плотной заливкой у выбранного. Мышь у выбранного даёт ту же плотную заливку.',
    pros: [
      'Мышь и клавиатура выглядят одинаково, выбор и курсор не путаются',
      'Ничего не добавляется поверх вида пункта',
    ],
    cons: [
      'На выбранном курсор заметен только по плотности заливки; в O4 без заливки — только серым',
    ],
    look: OPTION_LOOK.GAP,
    focus: OPTION_FOCUS.HOVER,
  },
  {
    code: 'K2',
    title: 'Кольцо фокуса',
    description:
      'Курсор клавиатуры — кольцо 2px цвета акцента внутри пункта, с зазором от рамки выбора. Мышь подсвечивает как раньше.',
    pros: [
      'Курсор одинаково заметен на выбранном и невыбранном пункте при любом виде из O',
      'Привычный знак фокуса с клавиатуры',
    ],
    cons: [
      'На выбранном с рамкой (O0–O2) — две рамки одна в другой',
      'Мышь и клавиатура подсвечивают по-разному',
    ],
    look: OPTION_LOOK.GAP,
    focus: OPTION_FOCUS.RING,
  },
];

const LOOK_OPTIONS = LOOK_VARIANTS.map(({ code, look }) => ({ label: code, value: look }));

const isOptionLook = (value: string): value is OptionLook =>
  Object.values(OPTION_LOOK).some((look) => look === value);

function PlaygroundMultiselectOptions() {
  const [focusLook, setFocusLook] = useState<OptionLook>(OPTION_LOOK.GAP);

  return (
    <Stack gap="xl" p="md">
      <Group gap="sm">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Пункты мультиселекта</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Вид выбранного пункта общий для Select, MultiSelect и сортировки каталога. Ниже две
        независимые оси: O — как выглядит выбранный пункт, K — как виден курсор при навигации
        стрелками; итог собирается комбинацией вроде «O1 + K1». У каждого варианта — застывшие
        списки в разных состояниях (наведение и фокус заданы, а не наведены) и живые поля под ними:
        откройте и пройдите стрелками. Смотрите в обеих темах. Всё без пометки «Только песочница»
        показано так, как пойдёт в реализацию.
      </Text>

      <DemoSection
        code={FINAL_VARIANT.code}
        title={FINAL_VARIANT.title}
        description={FINAL_VARIANT.description}
        pros={FINAL_VARIANT.pros}
        cons={FINAL_VARIANT.cons}
      >
        <VariantPreview lists={FINAL_LISTS} look={FINAL_VARIANT.look} focus={FINAL_VARIANT.focus} />
      </DemoSection>

      <AxisHeader
        title="O · Выбранный пункт"
        description="Курсор клавиатуры здесь везде как сейчас (K0), чтобы сравнивать только вид выбора."
      />
      {LOOK_VARIANTS.map(({ look, focus, ...variant }) => (
        <DemoSection key={variant.code} {...variant}>
          <VariantPreview lists={LOOK_LISTS} look={look} focus={focus} />
        </DemoSection>
      ))}

      <AxisHeader
        title="K · Курсор клавиатуры"
        description="Курсор показан на O1; переключатель ниже меняет вид выбранного пункта во всех вариантах K, чтобы проверить сочетание."
      />
      <SandboxOnly>
        <SegmentedControl
          data={LOOK_OPTIONS}
          value={focusLook}
          onChange={(value) => isOptionLook(value) && setFocusLook(value)}
        />
      </SandboxOnly>
      {FOCUS_VARIANTS.map(({ code, title, description, pros, cons, focus }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantPreview lists={FOCUS_LISTS} look={focusLook} focus={focus} />
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundMultiselectOptions;
