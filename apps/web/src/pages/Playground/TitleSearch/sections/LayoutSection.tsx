import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import ResultCards from '../components/ResultCards';
import SectionHeaderLink from '../components/SectionHeaderLink';
import SourceSection from '../components/SourceSection';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import { FOUND_READMANGA, FOUND_REMANGA } from '../mocks';
import { CARD_LAYOUT, type CardLayout, type Variant } from '../models';

/** ReadManga (10) и Реманга (3) — полная секция и короткая. */
const GROUPS = [FOUND_READMANGA, FOUND_REMANGA];

const renderSections = (layout: CardLayout) => (
  <VariantFrames>
    <Stack gap="xl">
      {GROUPS.map(({ source, items }) => (
        <SourceSection key={source.id} header={<SectionHeaderLink source={source} />}>
          <ResultCards items={items} layout={layout} />
        </SourceSection>
      ))}
    </Stack>
  </VariantFrames>
);

const VARIANTS: Variant[] = [
  {
    code: 'L0',
    title: 'Как сейчас: сетка с переносом',
    description: 'Сетка 2/3/5 колонок, все 10 карточек видны сразу.',
    pros: ['Всё найденное на виду, ничего не надо листать или раскрывать'],
    cons: [
      'На телефоне 10 карточек — 5 рядов на один источник; второй источник — через два экрана',
    ],
    render: () => renderSections(CARD_LAYOUT.WRAP),
  },
  {
    code: 'L1',
    title: 'Лента везде',
    description:
      'Один ряд обложек на источник, остальное — горизонтальной прокруткой, как глобальный поиск Mihon.',
    pros: [
      'Выдача короткая: все источники — за пару экранов',
      'Легко сравнить источники между собой',
    ],
    cons: ['На десктопе листать вбок мышью неудобно', 'Часть карточек всегда спрятана за краем'],
    render: () => renderSections(CARD_LAYOUT.RIBBON),
  },
  {
    code: 'L1s',
    title: 'Лента на Scroller',
    description:
      'L1 на Mantine Scroller: у краёв ленты — стрелки, затухающие в фон, появляются только там, куда ещё можно листать; мышью ленту можно тянуть. На телефоне — обычная прокрутка пальцем.',
    pros: [
      'Снимает главный минус L1: на десктопе листается стрелками и перетаскиванием',
      'Затухание у края подсказывает, что карточки есть дальше',
    ],
    cons: [
      'Стрелка перекрывает край крайней видимой обложки',
      'В виде «список» лента не работает — там столбик',
    ],
    render: () => renderSections(CARD_LAYOUT.SCROLLER),
  },
  {
    code: 'L2',
    title: 'Сетка на десктопе, лента на телефоне',
    description:
      'На широком экране 10 карточек — всего два ряда, сетка не мешает; на узком, где сетка растягивается в 5 рядов, — лента.',
    pros: [
      'Каждая ширина получает то, что у неё работает лучше',
      'Палец листает ленту естественно',
    ],
    cons: [
      'Две разные раскладки в одном компоненте',
      'В виде «список» лента не работает — там столбик',
    ],
    render: () => renderSections(CARD_LAYOUT.RIBBON_ON_PHONE),
  },
  {
    code: 'L3',
    title: 'Один ряд и «Показать ещё»',
    description:
      'Сетка свёрнута до одного ряда; «Показать ещё N» раскрывает уже пришедшие карточки здесь же, без запроса к серверу.',
    pros: ['Выдача короткая, и ничего не листается вбок'],
    cons: [
      'Лишний клик, чтобы увидеть остальные из уже найденного',
      'Похоже на отвергнутую в плане догрузку «Ещё» — легко ждать, что подгрузится больше 10',
    ],
    render: () => renderSections(CARD_LAYOUT.ONE_ROW),
  },
  {
    code: 'L4',
    title: 'Плотная сетка',
    description:
      'Колонок больше: 6 на десктопе, 3 на телефоне; в виде «список» — две колонки на десктопе.',
    pros: ['На телефоне 10 карточек — 4 ряда вместо 5', 'Больше на экран без прокрутки'],
    cons: [
      'Обложки мельче, чем в каталоге, — на телефоне названия в три слова уже обрезаются',
      'Другая плотность, чем на остальных страницах с карточками',
    ],
    render: () => renderSections(CARD_LAYOUT.DENSE),
  },
];

/** Ось L — раскладка карточек в секции. */
function LayoutSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="L"
        title="Раскладка карточек"
        description="Вопрос 3 плана. Шапка секции везде S1. Переключите «Сетка / список» вверху страницы — так видно и вид «список» в каждом варианте."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default LayoutSection;
