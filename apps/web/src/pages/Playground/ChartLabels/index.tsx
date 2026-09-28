import { useMemo, useState } from 'react';
import { Group, SegmentedControl, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import { DEMO_DATA, DESKTOP_WIDTH, MOBILE_WIDTH, type DemoData } from './models';
import { getDemoPoints } from './mocks';
import DemoCard from './components/DemoCard';
import LabelsTicks from './components/LabelsTicks';
import LabelsDayMonth from './components/LabelsDayMonth';
import LabelsHover from './components/LabelsHover';
import LabelsWeeks from './components/LabelsWeeks';
import LabelsAnchors from './components/LabelsAnchors';
import LabelsSlanted from './components/LabelsSlanted';
import LabelsAnchorsHover from './components/LabelsAnchorsHover';

/**
 * Подписи оси у «Прочитано глав» в режиме «Месяц»: 30 столбиков, подписать каждый нельзя, а
 * подпись шире столбика — и непонятно, к какому она относится. L0 — как сейчас, L1–L6 — варианты.
 */
function PlaygroundChartLabels() {
  const [data, setData] = useState<DemoData>(DEMO_DATA.MINE);
  const [isMobile, setIsMobile] = useState(false);

  const points = useMemo(() => getDemoPoints(data), [data]);
  const width = isMobile ? MOBILE_WIDTH : DESKTOP_WIDTH;

  return (
    <Stack gap="lg" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Подписи месячного графика</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Последние 30 дней до сегодня (пн, 28 сентября), поэтому ряд начинается в августе. Наведите
        на столбик — появится подсказка.
      </Text>
      <Group gap="md">
        <SegmentedControl
          size="xs"
          value={data}
          onChange={(value) => setData(value as DemoData)}
          data={[
            { label: 'Как у меня', value: DEMO_DATA.MINE },
            { label: 'Живые данные', value: DEMO_DATA.LIVE },
          ]}
        />
        <SegmentedControl
          size="xs"
          value={isMobile ? 'mobile' : 'desktop'}
          onChange={(value) => setIsMobile(value === 'mobile')}
          data={[
            { label: 'Десктоп', value: 'desktop' },
            { label: 'Мобильный', value: 'mobile' },
          ]}
        />
      </Group>
      <SimpleGrid
        cols={isMobile ? { base: 1, sm: 2, lg: 3 } : { base: 1, xl: 2 }}
        spacing="xl"
        verticalSpacing="xl"
      >
        <DemoSection
          code="L0"
          title="Как сейчас: дата и риска"
          description="«дд.мм» раз в неделю, от столбика к подписи идёт риска."
        >
          <DemoCard width={width}>
            <LabelsTicks points={points} />
          </DemoCard>
        </DemoSection>
        <DemoSection
          code="L1"
          title="Число + месяц на стыке"
          description="Под столбиком только число: оно узкое и стоит ровно под своим днём. Месяц подписан один раз, со своего первого дня, на стыке месяцев черта."
        >
          <DemoCard width={width}>
            <LabelsDayMonth points={points} />
          </DemoCard>
        </DemoSection>
        <DemoSection
          code="L2"
          title="Дата при наведении"
          description="Постоянно подписаны только края периода. У наведённого столбика дата встаёт на ось прямо под ним, сам столбик подсвечивается."
        >
          <DemoCard width={width}>
            <LabelsHover points={points} />
          </DemoCard>
        </DemoSection>
        <DemoSection
          code="L3"
          title="Разбивка по неделям"
          description="Недели от сегодняшнего дня назад, между ними зазор шире. Под неделей скобка и диапазон: подпись относится к группе, а не к одному дню."
        >
          <DemoCard width={width}>
            <LabelsWeeks points={points} />
          </DemoCard>
        </DemoSection>
        <DemoSection
          code="L4"
          title="Опорные столбики"
          description="Подписи как сейчас, но без рисок: подписанные столбики чуть темнее остальных."
        >
          <DemoCard width={width}>
            <LabelsAnchors points={points} />
          </DemoCard>
        </DemoSection>
        <DemoSection
          code="L5"
          title="Опорные столбики + наклон"
          description="L4, но подписи наклонены на 45°: конец даты упирается в центр своего столбика, как на большинстве графиков."
        >
          <DemoCard width={width}>
            <LabelsSlanted points={points} />
          </DemoCard>
        </DemoSection>
        <DemoSection
          code="L6"
          title="Опорные столбики + дата при наведении"
          description="L4 + L2: в покое подписи раз в неделю, подписанные столбики темнее. У наведённого столбика дата встаёт на ось прямо под ним, соседние недельные подписи на это время прячутся."
        >
          <DemoCard width={width}>
            <LabelsAnchorsHover points={points} />
          </DemoCard>
        </DemoSection>
      </SimpleGrid>
    </Stack>
  );
}

export default PlaygroundChartLabels;
