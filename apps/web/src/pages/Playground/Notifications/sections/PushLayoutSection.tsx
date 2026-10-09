import { useState } from 'react';
import { SegmentedControl, Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import PushBanner from '../components/PushBanner';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import { MOCK_FEED } from '../mocks';
import {
  LEADING,
  PUSH_LAYOUT,
  PUSH_OFFER_STATE,
  ROWS,
  type PushLayout,
  type PushOfferState,
} from '../models';

type Variant = {
  layout: PushLayout;
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
};

const VARIANTS: Variant[] = [
  {
    layout: PUSH_LAYOUT.CURRENT,
    code: 'M0',
    title: 'Как сейчас',
    description: 'Заголовок, абзац из трёх строк, две кнопки одна под другой.',
    pros: ['Всё объяснено'],
    cons: [
      'На телефоне занимает больше четверти экрана и отодвигает ленту',
      'Абзац повторяет то, что заголовок уже сказал',
    ],
  },
  {
    layout: PUSH_LAYOUT.COMPACT,
    code: 'M1',
    title: 'Компактно',
    description: 'Короткая строка вместо абзаца, кнопки «Включить» и «Не сейчас» в одну строку.',
    pros: ['Минимум правок к текущему виду', 'Вдвое ниже M0'],
    cons: ['Теряется упоминание, что тайтл добавлен в папку со слежением'],
  },
  {
    layout: PUSH_LAYOUT.INLINE,
    code: 'M2',
    title: 'Строка-приглашение',
    description: 'Одна плотная строка: вопрос, «Включить» и «×» вместо «Не сейчас».',
    pros: ['Высота обычной строки ленты', 'Почти не отодвигает ленту'],
    cons: [
      '«×» не говорит, что предложение вернётся на другом устройстве',
      'Длинный вопрос на 375 px переносится',
    ],
  },
  {
    layout: PUSH_LAYOUT.CARD,
    code: 'M3',
    title: 'Карточка в стиле ленты',
    description:
      'Тот же `Alert` с цветами темы, что у M0, но иконка в строке заголовка, короткое описание под текстом заголовка, кнопки «Включить push» и «Не сейчас» в один ряд на всю ширину.',
    pros: ['Цвета и иконка как у M0, привычно', 'Крупные кнопки под большой палец'],
    cons: ['Выше M1 и M2 из-за заголовка и строки'],
  },
];

const isState = (value: string): value is PushOfferState =>
  value === PUSH_OFFER_STATE.ASK || value === PUSH_OFFER_STATE.DENIED;

/** Ось M: вид предложения включить push, особенно на телефоне. */
function PushLayoutSection() {
  const [state, setState] = useState<PushOfferState>(PUSH_OFFER_STATE.ASK);

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="M"
        title="Предложение push на телефоне"
        description="Тот же K4 — первая строка ленты, — но с другим видом плашки. Ниже три строки ленты, чтобы видно, сколько плашка отодвигает."
      />
      <SandboxOnly>
        <SegmentedControl
          value={state}
          onChange={(next) => isState(next) && setState(next)}
          data={[
            { value: PUSH_OFFER_STATE.ASK, label: 'Предложение' },
            { value: PUSH_OFFER_STATE.DENIED, label: 'Браузер запретил' },
          ]}
        />
      </SandboxOnly>
      {VARIANTS.map(({ layout, ...rest }) => (
        <DemoSection key={rest.code} {...rest}>
          <Frames>
            <FeedPageMock
              items={MOCK_FEED.slice(0, 3)}
              rows={ROWS.CARDS}
              leading={LEADING.COVER_AND_ICON}
              top={<PushBanner state={state} layout={layout} />}
            />
          </Frames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PushLayoutSection;
