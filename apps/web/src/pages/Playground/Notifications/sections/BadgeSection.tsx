import { SimpleGrid, Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import NavBarMock from '../components/NavBarMock';
import DemoSection from '../../components/DemoSection';
import { BADGE, type Badge } from '../models';

const STATES = [
  { label: 'Ничего нового', count: 0, hasBookmarkDot: false },
  { label: '3 непрочитанных, в закладках есть новое', count: 3, hasBookmarkDot: true },
  { label: '120 непрочитанных, в закладках есть новое', count: 120, hasBookmarkDot: true },
  { label: '3 непрочитанных, в закладках нового нет', count: 3, hasBookmarkDot: false },
];

type VariantProps = { variant: Badge };

function BadgeStates({ variant }: VariantProps) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      {STATES.map((state) => (
        <NavBarMock key={state.label} variant={variant} {...state} />
      ))}
    </SimpleGrid>
  );
}

/** Ось B: бейдж на колокольчике в шапке (десктоп) и футере (мобилка). */
function BadgeSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="B"
        title="Бейдж на колокольчике"
        description="Точка закладок («в закладках есть новое») остаётся независимой и стоит на соседней иконке. Каждое состояние показано в шапке и в футере — с неактивным и открытым колокольчиком."
      />
      <DemoSection
        code="B0"
        title="Как сейчас"
        description="Голый колокольчик, ни числа, ни точки."
        cons={['Непрочитанного не видно — проблема, ради которой задача заведена']}
      >
        <BadgeStates variant={BADGE.NONE} />
      </DemoSection>
      <DemoSection
        code="B1"
        title="Число в красном кружке"
        description="Моноширинное число, больше 99 — «99+»."
        pros={['Сразу видно, сколько', 'Красный не путается с акцентной точкой закладок']}
        cons={['Рядом две разные метки, красный кружок шумнее точки']}
      >
        <BadgeStates variant={BADGE.COUNT} />
      </DemoSection>
      <DemoSection
        code="B2"
        title="Точка, как у закладок"
        description="Тот же `Indicator` 8 px, что на иконке закладок."
        pros={['Единый язык с закладками', 'Тише всего']}
        cons={[
          'Не видно, одно уведомление или сто',
          'Две одинаковые точки рядом читаются как одно',
        ]}
      >
        <BadgeStates variant={BADGE.DOT} />
      </DemoSection>
      <DemoSection
        code="B3"
        title="Гибрид: число в шапке, точка в футере"
        description="В футере места мало — там точка; на десктопе число."
        pros={['Число там, где для него есть место']}
        cons={['Один сигнал выглядит по-разному на разных экранах']}
      >
        <BadgeStates variant={BADGE.HYBRID} />
      </DemoSection>
    </Stack>
  );
}

export default BadgeSection;
