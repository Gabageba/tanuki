import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import HeaderCurrent from '../components/HeaderCurrent';
import RecentChipsAndInvite from '../components/RecentChipsAndInvite';
import RecentEmptyState from '../components/RecentEmptyState';
import RecentGroupedList from '../components/RecentGroupedList';
import RecentPageList from '../components/RecentPageList';
import EmptyPageTitle from '../components/EmptyPageTitle';
import SearchInvite from '../components/SearchInvite';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import type { Variant } from '../models';

const NO_HISTORY = '375 px · истории нет';

const VARIANTS: Variant[] = [
  {
    code: 'E0',
    title: 'Как сейчас',
    description: 'Заголовок и пустая строка ввода; больше ничего.',
    pros: ['Ничего'],
    cons: ['Странице нечего показать: ни недавних, ни подсказки, что делать'],
    render: () => (
      <VariantFrames>
        <HeaderCurrent query="" />
      </VariantFrames>
    ),
  },
  {
    code: 'E1',
    title: 'Недавние списком',
    description:
      'Тот же список, что в дропдауне, только просторнее: строки крупнее, крестик виден всегда. Без истории — приглашение искать.',
    pros: ['Один и тот же список в шапке и на странице', 'Крупные строки — удобно пальцем'],
    cons: ['С историей и без — две совсем разные страницы'],
    render: () => (
      <VariantFrames
        extraPhones={[{ label: NO_HISTORY, content: <RecentPageList hasHistory={false} /> }]}
      >
        <RecentPageList hasHistory />
      </VariantFrames>
    ),
  },
  {
    code: 'E2',
    title: 'Приглашение с недавними внутри',
    description:
      'Всегда EmptyState «Ищите по названию»; если история есть — недавние пилюлями в его действиях.',
    pros: ['Страница одинакова с историей и без', 'Подсказка, что делать, есть всегда'],
    cons: [
      'Длинный запрос в пилюле обрезается',
      'Пилюли разного размера — ряд рваный, порядок «свежие сверху» читается хуже',
    ],
    render: () => (
      <VariantFrames
        extraPhones={[{ label: NO_HISTORY, content: <RecentEmptyState hasHistory={false} /> }]}
      >
        <RecentEmptyState hasHistory />
      </VariantFrames>
    ),
  },
  {
    code: 'E3',
    title: 'GroupedList',
    description:
      'Недавние — группой строк, как блоки настроек: служебная подпись, рамка, «Очистить» в подвале.',
    pros: ['Тот же язык, что в настройках и профиле'],
    cons: ['Тяжеловато для пары набранных слов', 'Подвал с одной кнопкой на всю ширину'],
    render: () => (
      <VariantFrames
        extraPhones={[{ label: NO_HISTORY, content: <RecentGroupedList hasHistory={false} /> }]}
      >
        <RecentGroupedList hasHistory />
      </VariantFrames>
    ),
  },
  {
    code: 'E4',
    title: 'Ряд недавних и приглашение',
    description:
      'Сверху — компактный ряд пилюль недавних с «Очистить», под ним приглашение остаётся всегда.',
    pros: ['Недавние на виду, а страница не пустеет и с ними'],
    cons: ['Два блока на пустой странице', 'Те же рваные пилюли, что в E2'],
    render: () => (
      <VariantFrames
        extraPhones={[{ label: NO_HISTORY, content: <RecentChipsAndInvite hasHistory={false} /> }]}
      >
        <RecentChipsAndInvite hasHistory />
      </VariantFrames>
    ),
  },
  {
    code: 'E5',
    title: 'Только приглашение',
    description:
      'На /search без запроса не ведёт ни одна ссылка — туда попадают только по адресу руками или по закладке браузера. Поэтому недавних здесь нет: они в дропдауне строки поиска; страница лишь приглашает искать.',
    pros: ['Один вид при любой истории', 'Недавние живут в одном месте — в дропдауне шапки'],
    cons: [
      'Кто открыл /search по закладке, недавних здесь не увидит — только поставив фокус в строку',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="md">
          <EmptyPageTitle />
          <SearchInvite />
        </Stack>
      </VariantFrames>
    ),
  },
];

/** Ось E — пустая `/search`. */
function EmptyPageSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="E"
        title="Пустая /search"
        description="Вопрос 6 плана: страница без запроса. У каждого варианта — с историей (десктоп и 375) и без неё (третья рамка)."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default EmptyPageSection;
