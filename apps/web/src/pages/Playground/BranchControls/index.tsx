import type { ReactNode } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import DeviceFrames from '../AdultContent/components/DeviceFrames';
import { DESKTOP_WIDTH } from './models';
import VariantCurrent from './components/VariantCurrent';
import VariantSelect from './components/VariantSelect';
import VariantChips from './components/VariantChips';
import VariantListHeader from './components/VariantListHeader';
import VariantCards from './components/VariantCards';
import VariantToolbar from './components/VariantToolbar';

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  render: (narrow: boolean) => ReactNode;
};

const VARIANTS: Variant[] = [
  {
    code: 'B0',
    title: 'Как сейчас',
    description:
      'Tile-табы веток и кнопка сортировки одинаковые по рамке, фону, радиусу и высоте и стоят друг под другом — сортировка читается как ещё одна ветка, перенесённая на новую строку.',
    pros: ['Все ветки и число глав видны сразу, выбор в один клик.'],
    cons: [
      'Сортировка неотличима от ветки: та же рамка, фон и высота.',
      'Три яруса похожих контролов подряд: табы страницы, ветки, кнопки.',
      'Нет иконок у табов веток и у «Скачать все», хотя CLAUDE.md их требует.',
    ],
    render: () => <VariantCurrent />,
  },
  {
    code: 'B1',
    title: 'Ветка в Select',
    description:
      'Ветка — поле выбора, а не ряд кнопок: тип контрола сам отделяет «какой список» от «что с ним сделать». Всё в одной строке.',
    pros: [
      'Тип контрола сразу разводит выбор и действия, путать нечего.',
      'Не растёт с числом веток и длиной названий: 2 ветки или 10 занимают одну строку.',
      'На десктопе весь блок — одна строка, список глав выше.',
    ],
    cons: [
      'Остальные ветки и их полнота видны только в раскрытом списке.',
      'Переключение — два клика вместо одного.',
      'Длинное название обрезается в закрытом поле.',
    ],
    render: (narrow) => <VariantSelect narrow={narrow} />,
  },
  {
    code: 'B2',
    title: 'Ветки пилюлями с подписью',
    description:
      'Ветки остаются на виду, но меняют форму: низкие круглые пилюли под подписью «Ветка перевода», переносятся в несколько строк. Действия ниже линии — прямоугольные кнопки.',
    pros: [
      'Ветки остаются на виду, выбор в один клик.',
      'Подпись «Ветка перевода» объясняет, что это за ряд, тем, кто не знает про ветки.',
    ],
    cons: [
      'При 5–6 длинных ветках пилюли занимают 2–3 строки и отодвигают список.',
      'Различие только в форме — пилюля и кнопка всё ещё одного веса.',
      'Подпись и линия — лишние элементы, которые решают проблему добавлением, а не упрощением.',
    ],
    render: () => <VariantChips />,
  },
  {
    code: 'B3',
    title: 'Действия в шапке списка',
    description:
      'Ветки — те же tile-табы, а сортировка и «Скачать все» уезжают внутрь карточки списка, в её шапку. Разделение по уровню: снаружи выбираем список, внутри работаем с ним.',
    pros: [
      'Самая маленькая правка: ветки не меняются, переезжают только кнопки.',
      'Действия стоят там, к чему относятся, — у самого списка.',
      'Ветки сохраняют прежний вид, к которому уже привыкли.',
    ],
    cons: [
      'Табы веток и кнопки по-прежнему одного вида, разводит их только рамка карточки.',
      'Уменьшенные кнопки в шапке заметнее теряются, особенно «Скачать все».',
    ],
    render: () => <VariantListHeader />,
  },
  {
    code: 'B4',
    title: 'Карточки веток с метой',
    description:
      'Каждая ветка — двухстрочная карточка: имя, под ним число глав и давность обновления. По размеру и устройству не похожа на кнопку и заодно подсказывает, какая ветка живая.',
    pros: [
      'Карточки по форме и размеру не спутать с кнопкой.',
      'Давность обновления подсказывает, какая ветка живая, — данные уже есть в Branch.lastUpdatedAt.',
      'Ветки на виду, выбор в один клик.',
    ],
    cons: [
      'Самый высокий блок: карточки в две строки плюс строка действий.',
      'Длинные названия обрезаются до одной строки.',
      'При 5–6 ветках часть уезжает за горизонтальный скролл, который легко не заметить.',
    ],
    render: (narrow) => <VariantCards narrow={narrow} />,
  },
  {
    code: 'B5',
    title: 'Панель в шапке списка',
    description:
      'B1 + B3: ветка полем, сортировка и скачивание — одна панель в шапке карточки списка. Снаружи ничего, весь блок глав — одна карточка.',
    pros: [
      'Самый компактный: над списком нет ничего, весь блок глав — одна карточка.',
      'Выбор и действия сгруппированы в одну панель и не спорят с табами страницы.',
    ],
    cons: [
      'Те же минусы Select, что у B1: ветки скрыты, переключение в два клика.',
      'На телефоне шапка карточки становится двухэтажной.',
      'Мелкие xs-контролы теснее, чем остальные кнопки страницы.',
    ],
    render: (narrow) => <VariantToolbar narrow={narrow} />,
  },
];

/** Выбор ветки и сортировка выглядят одинаково и сливаются — ищем, как их развести. */
function PlaygroundBranchControls() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Ветки и сортировка глав</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Блок глав на странице тайтла: 6 веток, среди них с длинными названиями. Каждый вариант — на
        десктопе и в рамке телефона, ветки и сортировка переключаются. Смотрите в обеих темах. Всё
        показано так, как пойдёт в реализацию.
      </Text>
      {VARIANTS.map(({ code, title, description, pros, cons, render }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <DeviceFrames desktopWidth={DESKTOP_WIDTH} render={render} />
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundBranchControls;
