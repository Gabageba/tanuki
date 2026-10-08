import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import FilterPills from '../components/FilterPills';
import HeaderCurrent from '../components/HeaderCurrent';
import HeaderQueryTitle from '../components/HeaderQueryTitle';
import HeaderResultsFor from '../components/HeaderResultsFor';
import HeaderTitleQuery from '../components/HeaderTitleQuery';
import HeaderToolbarOnly from '../components/HeaderToolbarOnly';
import PageHeaderBox from '../components/PageHeaderBox';
import SourceAnchors from '../components/SourceAnchors';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import { countFilters } from '../lib';
import { MOCK_FOUND } from '../mocks';
import { PRESET_FILTERS, type Variant } from '../models';

const FILTERS_COUNT = countFilters(PRESET_FILTERS);

const pills = <FilterPills filters={PRESET_FILTERS} onChange={() => {}} />;

const VARIANTS: Variant[] = [
  {
    code: 'H0',
    title: 'Как сейчас',
    description: 'Заголовок «Поиск» и своя строка ввода на странице, вдобавок к строке в шапке.',
    pros: ['Запрос можно поправить, не поднимаясь к шапке'],
    cons: ['Две строки ввода с одним и тем же текстом', 'Нет места для вида карточек и «Фильтров»'],
    render: () => (
      <VariantFrames>
        <HeaderCurrent />
      </VariantFrames>
    ),
  },
  {
    code: 'H1',
    title: '«Поиск» и запрос под ним',
    description:
      'Обычный заголовок страницы, запрос — приглушённой строкой под ним; справа переключатель вида, на телефоне перед ним «Фильтры». Пилюли выбранного — под шапкой.',
    pros: [
      'Шапка такая же, как у остальных страниц',
      'Запрос виден и тогда, когда строка в шапке прокручена',
    ],
    cons: ['Запрос показан дважды — в шапке приложения и здесь'],
    render: () => (
      <VariantFrames>
        <Stack gap="sm">
          <PageHeaderBox>
            <HeaderTitleQuery filtersCount={FILTERS_COUNT} />
          </PageHeaderBox>
          {pills}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'H2',
    title: '«Результаты по «…»»',
    description: 'Запрос входит в сам заголовок, под ним — сводка: на скольких источниках нашлось.',
    pros: ['Сразу ясно, что искали и чем кончилось'],
    cons: [
      'Длинный запрос раздувает заголовок: на телефоне — три строки крупным',
      'Сводка повторяет то, что и так видно по секциям',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="sm">
          <PageHeaderBox>
            <HeaderResultsFor filtersCount={FILTERS_COUNT} foundCount={MOCK_FOUND.length} />
          </PageHeaderBox>
          {pills}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'H3',
    title: 'Без заголовка',
    description:
      'Запрос живёт только в строке шапки приложения; страница начинается с пилюль фильтров и переключателя вида.',
    pros: ['Выдача начинается выше всего'],
    cons: [
      'У страницы нет названия — без фильтров тулбар висит одним переключателем',
      'На телефоне строка шапки уезжает при прокрутке, и запрос не виден вовсе',
    ],
    render: () => (
      <VariantFrames>
        <HeaderToolbarOnly filtersCount={FILTERS_COUNT}>{pills}</HeaderToolbarOnly>
      </VariantFrames>
    ),
  },
  {
    code: 'H4',
    title: 'H1 и чипы-якоря',
    description:
      'Как H1, а под заголовком — ряд источников, где нашлось, с числом карточек; клик прокручивает к секции. Состав выдачи читается до первой обложки.',
    pros: [
      'Видно, где есть тайтл, не листая все секции',
      'До нижних источников — один клик, а не 5 рядов прокрутки',
    ],
    cons: [
      'Ещё один ряд над выдачей, на телефоне — два',
      'Число — не больше 10: «10» на деле значит «10 и больше»',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="sm">
          <PageHeaderBox>
            <HeaderTitleQuery filtersCount={FILTERS_COUNT}>
              <SourceAnchors found={MOCK_FOUND} />
            </HeaderTitleQuery>
          </PageHeaderBox>
          {pills}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'H5',
    title: 'Запрос как заголовок',
    description: 'Крупно — сам запрос, «Поиск» — мелкой служебной подписью над ним, как раздел.',
    pros: ['Главное на странице — то, что человек набрал'],
    cons: [
      'Заголовок вида, которого нет больше нигде в приложении',
      'Длинный запрос — две строки крупного текста',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="sm">
          <PageHeaderBox>
            <HeaderQueryTitle filtersCount={FILTERS_COUNT} />
          </PageHeaderBox>
          {pills}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'H6a',
    title: 'H2 + H4: сводка и чипы',
    description:
      'Прямое объединение: заголовок «Результаты по «…»», под ним строка «Нашлось на 4 источниках», ниже — ряд чипов-якорей.',
    pros: ['Ничего не потеряно ни из H2, ни из H4'],
    cons: [
      'Сводка и чипы говорят одно: число источников видно и в строке, и по чипам',
      'На телефоне 3–4 строки до пилюль фильтров',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="sm">
          <PageHeaderBox>
            <HeaderResultsFor filtersCount={FILTERS_COUNT} foundCount={MOCK_FOUND.length}>
              <SourceAnchors found={MOCK_FOUND} />
            </HeaderResultsFor>
          </PageHeaderBox>
          {pills}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'H6b',
    title: 'H2 + H4: чипы вместо сводки',
    description:
      'Заголовок «Результаты по «…»», сразу под ним — чипы. Сводку текстом заменяют сами чипы: где нашлось и сколько.',
    pros: ['Без повтора', 'На строку короче H6a'],
    cons: ['Нет фразы «нашлось на N» — число источников считаешь по чипам'],
    render: () => (
      <VariantFrames>
        <Stack gap="sm">
          <PageHeaderBox>
            <HeaderResultsFor filtersCount={FILTERS_COUNT}>
              <SourceAnchors found={MOCK_FOUND} />
            </HeaderResultsFor>
          </PageHeaderBox>
          {pills}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'H6c',
    title: 'H2 + H4: чипы внутри сводки',
    description:
      'Под заголовком одна строка: подпись «Нашлось на:» и следом чипы, переносятся по ширине.',
    pros: ['Читается фразой, и чипы объяснены подписью', 'Высотой как H6b'],
    cons: ['При 5+ источниках строка переносится, и подпись остаётся одна в начале первой строки'],
    render: () => (
      <VariantFrames>
        <Stack gap="sm">
          <PageHeaderBox>
            <HeaderResultsFor filtersCount={FILTERS_COUNT}>
              <SourceAnchors found={MOCK_FOUND} label="Нашлось на:" />
            </HeaderResultsFor>
          </PageHeaderBox>
          {pills}
        </Stack>
      </VariantFrames>
    ),
  },
];

/** Ось H — шапка страницы с запросом. */
function HeaderSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="H"
        title="Шапка страницы с запросом"
        description="Вопрос 1 плана. Строка ввода — одна, в шапке приложения; здесь — что страница пишет о запросе сама. Пилюли выбранных фильтров одинаковы во всех вариантах (H3 ставит их на место заголовка)."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default HeaderSection;
