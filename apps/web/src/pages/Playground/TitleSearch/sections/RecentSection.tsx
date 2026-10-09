import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import HeaderSearchMock from '../components/HeaderSearchMock';
import RecentDropdownCompact from '../components/RecentDropdownCompact';
import RecentDropdownFooter from '../components/RecentDropdownFooter';
import RecentDropdownHover from '../components/RecentDropdownHover';
import RecentFullscreen from '../components/RecentFullscreen';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import type { Variant } from '../models';

const VARIANTS: Variant[] = [
  {
    code: 'D0',
    title: 'Как сейчас',
    description: 'Фокус в пустой строке ничего не открывает.',
    pros: ['Ничего не всплывает поверх страницы'],
    cons: ['Каждый запрос набирается заново'],
    render: () => (
      <VariantFrames>
        <HeaderSearchMock />
      </VariantFrames>
    ),
  },
  {
    code: 'D1',
    title: 'Часы и крестик под курсором',
    description:
      'Подпись «Недавние запросы» с «Очистить» справа; у пункта — часы, крестик появляется под курсором. На тач-экране наведения нет — там крестик виден всегда.',
    pros: ['Как история в браузерах', 'Список спокойный, пока не навёл'],
    cons: ['Мышью крестик не найти, пока не наведёшь', 'Два поведения: мышь и палец'],
    render: () => (
      <VariantFrames>
        <HeaderSearchMock dropdown={<RecentDropdownHover />} />
      </VariantFrames>
    ),
  },
  {
    code: 'D2',
    title: 'Крестик всегда, «Очистить» внизу',
    description:
      'У каждого пункта крестик виден сразу; «Очистить» — подвалом после списка, а не в заголовке.',
    pros: ['Удаление видно без наведения, одинаково мышью и пальцем'],
    cons: ['Десять крестиков — шумный столбик', '«Очистить» внизу легко не заметить'],
    render: () => (
      <VariantFrames>
        <HeaderSearchMock dropdown={<RecentDropdownFooter />} />
      </VariantFrames>
    ),
  },
  {
    code: 'D3',
    title: 'Плотный без иконок',
    description:
      'Пункты без часов и ниже ростом; «Очистить» — корзиной в заголовке. Крестик — как в D1.',
    pros: ['Все 10 запросов помещаются без прокрутки'],
    cons: [
      'Без часов пункты не отличить от подсказок, если их когда-нибудь добавят',
      'Корзина без подписи — что она чистит, видно только из тултипа',
    ],
    render: () => (
      <VariantFrames>
        <HeaderSearchMock dropdown={<RecentDropdownCompact />} />
      </VariantFrames>
    ),
  },
  {
    code: 'D4',
    title: 'На телефоне — во весь экран',
    description:
      'На десктопе — как D1. На телефоне фокус открывает поиск поверх страницы: строка во всю ширину со стрелкой назад, недавние — крупным списком без рамки дропдауна.',
    pros: [
      'На 375 px у списка вся ширина, строки крупные под палец',
      'Привычно по мобильным приложениям',
    ],
    cons: ['Новый режим шапки: стрелка назад, закрытие, клавиатура — всё придётся сделать'],
    render: () => (
      <VariantFrames phone={<RecentFullscreen />}>
        <HeaderSearchMock dropdown={<RecentDropdownHover />} />
      </VariantFrames>
    ),
  },
];

/** Ось D — дропдаун недавних у строки поиска в шапке. */
function RecentSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="D"
        title="Дропдаун недавних"
        description="Вопрос 5 плана. Строка в шапке в фокусе и пуста — под ней до 10 последних запросов, свежие сверху. Клик — поиск без фильтров; крестик и «Очистить» — без подтверждения. Наведите курсор на пункт, чтобы увидеть крестик в D1 и D3."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default RecentSection;
