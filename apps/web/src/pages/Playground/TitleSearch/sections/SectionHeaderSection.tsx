import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import ResultCards from '../components/ResultCards';
import SectionCard from '../components/SectionCard';
import SectionFooterButton from '../components/SectionFooterButton';
import SectionHeaderLink from '../components/SectionHeaderLink';
import SectionHeaderPlain from '../components/SectionHeaderPlain';
import SectionHeaderTitleLink from '../components/SectionHeaderTitleLink';
import SourceSection from '../components/SourceSection';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import { FOUND_REMANGA, FOUND_SENKURO } from '../mocks';
import { CARD_LAYOUT, type Variant } from '../models';

/** Реманга (3) и Senkuro (1): короткие секции, сравнивать тут шапки. */
const GROUPS = [FOUND_REMANGA, FOUND_SENKURO];

const VARIANTS: Variant[] = [
  {
    code: 'S0',
    title: 'Как сейчас',
    description:
      'Название источника заголовком h3, ни иконки, ни ссылки. Секции рисуются и пустые, со статусом — это закрывают ось N и план.',
    pros: ['Ничего лишнего'],
    cons: [
      'Из выдачи не попасть в каталог источника, чтобы увидеть больше',
      'Без логотипа источники различаются только словом',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="xl">
          {GROUPS.map(({ source, items }) => (
            <SourceSection key={source.id} header={<SectionHeaderPlain source={source} />}>
              <ResultCards items={items} layout={CARD_LAYOUT.WRAP} />
            </SourceSection>
          ))}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'S1',
    title: 'SourceTitle и «Все результаты» справа',
    description:
      'Шапка как у каталога источника: логотип, название, домен. «Все результаты →» — в той же строке справа.',
    pros: [
      'Ссылка всегда на виду, в одном месте у каждой секции',
      'Тот же вид источника, что в каталоге',
    ],
    cons: ['На телефоне ссылка отнимает место у длинного названия источника'],
    render: () => (
      <VariantFrames>
        <Stack gap="xl">
          {GROUPS.map(({ source, items }) => (
            <SourceSection key={source.id} header={<SectionHeaderLink source={source} />}>
              <ResultCards items={items} layout={CARD_LAYOUT.WRAP} />
            </SourceSection>
          ))}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'S2',
    title: 'S1 и счётчик',
    description: 'Как S1, а рядом с названием — сколько карточек пришло, моноширинным.',
    pros: ['Видно, где нашлось много, а где одно совпадение'],
    cons: [
      'Сервер отдаёт до 10: «10» на деле значит «10 и больше», а сказать это честнее нечем',
      'Число и так видно по карточкам',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="xl">
          {GROUPS.map(({ source, items }) => (
            <SourceSection
              key={source.id}
              header={<SectionHeaderLink source={source} count={items.length} />}
            >
              <ResultCards items={items} layout={CARD_LAYOUT.WRAP} />
            </SourceSection>
          ))}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'S3',
    title: '«Все результаты» под карточками',
    description:
      'Шапка — только источник; ссылка — кнопкой во всю ширину после карточек, как продолжение списка.',
    pros: ['Попадается ровно тогда, когда карточки досмотрены', 'Крупная цель для пальца'],
    cons: [
      'Не видна, пока не прокрутишь секцию',
      'На каждой секции по широкой кнопке — выдача становится полосатой',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="xl">
          {GROUPS.map(({ source, items }) => (
            <SourceSection
              key={source.id}
              header={<SectionHeaderLink source={source} withLink={false} />}
              footer={<SectionFooterButton source={source} />}
            >
              <ResultCards items={items} layout={CARD_LAYOUT.WRAP} />
            </SourceSection>
          ))}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'S4',
    title: 'Секция в рамке',
    description: 'Каждый источник — карточка: полоса-шапка с названием и ссылкой, обложки внутри.',
    pros: ['Граница между источниками однозначна'],
    cons: [
      'Рамка вокруг карточек, у которых своя рамка в виде «список»',
      'На телефоне рамка съедает ширину двух колонок',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="md">
          {GROUPS.map(({ source, items }) => (
            <SectionCard key={source.id} source={source}>
              <ResultCards items={items} layout={CARD_LAYOUT.WRAP} />
            </SectionCard>
          ))}
        </Stack>
      </VariantFrames>
    ),
  },
  {
    code: 'S5',
    title: 'Весь заголовок — ссылка',
    description:
      'Логотип, название и «›» — одна ссылка в каталог источника, как в Mihon и Google Play. Отдельной надписи нет.',
    pros: ['Меньше всего элементов', 'Знакомо по магазинам приложений'],
    cons: [
      'Не очевидно, что заголовок кликабелен и куда ведёт',
      'Нет домена — два источника одной сети не различить',
    ],
    render: () => (
      <VariantFrames>
        <Stack gap="xl">
          {GROUPS.map(({ source, items }) => (
            <SourceSection key={source.id} header={<SectionHeaderTitleLink source={source} />}>
              <ResultCards items={items} layout={CARD_LAYOUT.WRAP} />
            </SourceSection>
          ))}
        </Stack>
      </VariantFrames>
    ),
  },
];

/** Ось S — шапка секции источника. */
function SectionHeaderSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="Секция источника"
        description="Вопрос 2 плана: как подписан источник, где «Все результаты», нужен ли счётчик. Карточки везде — сеткой L0, чтобы сравнивать только шапку; показаны Реманга (3) и Senkuro (1)."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default SectionHeaderSection;
