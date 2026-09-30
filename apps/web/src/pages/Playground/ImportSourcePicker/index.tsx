import type { ReactNode } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import type { VariantProps } from './models';
import PickerDemo from './components/PickerDemo';
import VariantCards from './components/VariantCards';
import VariantCardsFlat from './components/VariantCardsFlat';
import VariantCardsGrouped from './components/VariantCardsGrouped';
import VariantCardsHeader from './components/VariantCardsHeader';
import VariantGrouped from './components/VariantGrouped';
import VariantInstant from './components/VariantInstant';
import VariantRadioList from './components/VariantRadioList';
import VariantSelect from './components/VariantSelect';
import VariantTiles from './components/VariantTiles';
import VariantTilesFlat from './components/VariantTilesFlat';
import VariantTilesGrouped from './components/VariantTilesGrouped';

type Variant = {
  code: string;
  title: string;
  description: string;
  isInstant?: boolean;
  render: (props: VariantProps) => ReactNode;
};

const VARIANTS: Variant[] = [
  {
    code: 'C0',
    title: 'Как сейчас, но по источникам',
    description:
      'Прежний список радио-кнопок, только строка — источник, а не сеть. Точка отсчёта: без иконок, недоступные строки и кнопки «Войти» идут вперемешку с доступными.',
    render: (props) => <VariantRadioList {...props} />,
  },
  {
    code: 'C1',
    title: 'Карточки',
    description:
      'Каждая строка — карточка с логотипом, кликабельная целиком; выбранная обведена и подкрашена. Недоступные остаются в списке с кнопкой «Войти» вместо радио.',
    render: (props) => <VariantCards {...props} />,
  },
  {
    code: 'C2',
    title: 'Плитка логотипов',
    description:
      'Сетка в три колонки: источник узнают по иконке. Недоступные приглушены и с замком, причина — в подсказке. Аккаунт выбранного источника назван под сеткой.',
    render: (props) => <VariantTiles {...props} />,
  },
  {
    code: 'C3',
    title: 'Рамки по сетям',
    description:
      'Тот же вид, что на вкладке «Аккаунты источников»: шапка с состоянием аккаунта один раз на сеть, под ней её источники. Сеть без входа — одна шапка с кнопкой «Войти».',
    render: (props) => <VariantGrouped {...props} />,
  },
  {
    code: 'C4',
    title: 'Выпадающий список',
    description:
      'Одно поле с поиском, источники сгруппированы по сетям, недоступные серые с причиной. Самый короткий шаг, но список спрятан за кликом.',
    render: (props) => <VariantSelect {...props} />,
  },
  {
    code: 'C5',
    title: 'Меню без кнопки',
    description:
      'Клик по источнику сразу запускает чтение закладок — «Найти закладки» не нужна. В списке только доступные, остальные упомянуты сноской со ссылкой на аккаунты.',
    isInstant: true,
    render: (props) => <VariantInstant {...props} />,
  },
];

/** Второй круг по C1 и C2: видно, не выполнен вход или пора войти заново, и к какой сети относится источник. */
const REFINED_VARIANTS: Variant[] = [
  {
    code: 'C1a',
    title: 'Карточки, сеть в каждой строке',
    description:
      'Плоский список. Вторая строка — сеть и логин, а у недоступных — сеть и состояние с иконкой: «Вход не выполнен» в фирменном цвете, «Войдите заново» — в золотом. Кнопка тоже разная: «Войти» и «Войти заново».',
    render: (props) => <VariantCardsFlat {...props} />,
  },
  {
    code: 'C1b',
    title: 'Карточки под подписью сети',
    description:
      'Источники собраны по сетям. В подписи — название сети, логин или состояние входа и одна кнопка на всю сеть. Карточки без второй строки, недоступные приглушены.',
    render: (props) => <VariantCardsGrouped {...props} />,
  },
  {
    code: 'C1c',
    title: 'Рамка сети с шапкой аккаунта',
    description:
      'C1b, но сеть — одна рамка, как на вкладке «Аккаунты источников»: шапка в цвете состояния называет вход и логин и несёт кнопку входа, под ней в той же рамке — источники строками с радио. Недоступные остаются в рамке приглушёнными.',
    render: (props) => <VariantCardsHeader {...props} />,
  },
  {
    code: 'C1d',
    title: 'Рамка с шапкой, сети без входа свёрнуты',
    description:
      'C1c, но строки есть только там, где вход выполнен. Сеть без входа — одна шапка: состояние, кнопка входа, а её источники перечислены в описании. Шаг почти вдвое короче, выбрать всё равно можно только доступное.',
    render: (props) => <VariantCardsHeader {...props} isLockedCollapsed />,
  },
  {
    code: 'C2a',
    title: 'Плитка, сеть и состояние под названием',
    description:
      'Одна сетка. Под названием — сеть, у недоступных ещё строка с причиной в цвете состояния; в углу вместо замка — иконка состояния. Войти — по общей кнопке под сеткой.',
    render: (props) => <VariantTilesFlat {...props} />,
  },
  {
    code: 'C2b',
    title: 'Плитка под подписью сети',
    description:
      'Сетка разбита по сетям, подпись та же, что в C1b: сеть, логин или состояние, кнопка входа. Плитка несёт только логотип, название и иконку состояния. Сеть из одного источника — одинокая плитка.',
    render: (props) => <VariantTilesGrouped {...props} />,
  },
];

/** Первый шаг импорта с источника: выбираем конкретный источник, а не сеть — ищем, как это показать. */
function PlaygroundImportSourcePicker() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Выбор источника для импорта</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Данные одни на все макеты: в Grouple вход выполнен (ReadManga, MintManga, SelfManga), в
        LibSocial сессия истекла (MangaLib, HentaiLib), в AllHentai и Реманге аккаунта нет. Рамка —
        шириной с модалку; выбор в каждом макете работает.
      </Text>
      <Title order={3}>Первый круг</Title>
      {VARIANTS.map(({ code, title, description, isInstant, render }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <PickerDemo isInstant={isInstant}>{render}</PickerDemo>
        </DemoSection>
      ))}

      <Title order={3}>Второй круг: C1 и C2 с сетью и состоянием входа</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Два требования к выбранным вариантам: отличать «вход не выполнен» от «нужно войти заново» и
        показывать, к какой сети относится источник. На каждый вариант — плоский список и разбивка
        по сетям.
      </Text>
      {REFINED_VARIANTS.map(({ code, title, description, render }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <PickerDemo>{render}</PickerDemo>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundImportSourcePicker;
