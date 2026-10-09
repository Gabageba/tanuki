import { Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import DemoSection from '../../components/DemoSection';
import { ROWS, type Rows } from '../models';

type Variant = {
  code: string;
  rows: Rows;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
};

const VARIANTS: Variant[] = [
  {
    code: 'R0',
    rows: ROWS.LEGACY,
    title: 'Как было: разделитель, подсветка слева',
    description:
      'Линия между строками; при наведении красится только левая часть, «×» остаётся снаружи.',
    pros: ['Привычная линия между строками'],
    cons: ['Подсветка не доходит до «×»', 'Скруглённые углы подсветки врезаются в разделитель'],
  },
  {
    code: 'R1',
    rows: ROWS.FULL_DIVIDER,
    title: 'Разделитель во всю ширину, подсветка на всю строку',
    description:
      'Линия от края до края, при наведении красится вся строка, включая «×», без скруглений.',
    pros: ['Подсветка и разделитель не спорят', '«×» внутри строки'],
    cons: ['Строки с обложкой выше строк с иконкой — ритм линий неровный'],
  },
  {
    code: 'R2',
    rows: ROWS.CARDS,
    title: 'Карточки с собственным фоном',
    description: 'Каждая строка — карточка с рамкой и фоном, между ними зазор.',
    pros: ['Каждое уведомление — отдельный объект'],
    cons: ['Много рамок, на 375 px тяжело'],
  },
  {
    code: 'R3',
    rows: ROWS.FRAME,
    title: 'Общая рамка вокруг ленты',
    description:
      'Лента в одном скруглённом контейнере; внутри тонкие линии и подсветка на всю строку.',
    pros: ['Лента читается как один блок', 'Лёгче карточек'],
    cons: ['Фильтр и страницы остаются снаружи, граница блока неочевидна на узком экране'],
  },
  {
    code: 'R4',
    rows: ROWS.INSET_DIVIDER,
    title: 'Разделитель с отступом от текста',
    description: 'Как в iOS: линия начинается от заголовка, обложка и иконка остаются без линии.',
    pros: ['Линия не режет обложки и иконки'],
    cons: ['Линия короче и слабее, на телефоне почти не видна'],
  },
  {
    code: 'R5',
    rows: ROWS.PLAIN,
    title: 'Без разделителей, только подсветка и зазор',
    description: 'Скруглённая подсветка на всю строку и зазор 2 px. Отвергнуто: строки сливаются.',
    pros: ['Самый лёгкий вид'],
    cons: ['Без линий и фона строки сливаются в кашу'],
  },
];

/** Ось R: как отделить строки ленты друг от друга. */
function SeparationSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="R"
        title="Разделение строк"
        description="Одна и та же лента на L1 + N1. Подсветка при наведении, клик по строке и «×» живые. R0 — прежний вид без изменений, остальные — вариации рядом."
      />
      {VARIANTS.map(({ code, rows, title, description, pros, cons }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Frames>
            <FeedPageMock rows={rows} />
          </Frames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default SeparationSection;
