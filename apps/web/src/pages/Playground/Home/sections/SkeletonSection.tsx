import { useState } from 'react';
import { Group, SegmentedControl, Stack, Text } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import HomeSourceSection from '../components/HomeSourceSection';
import HomeSourceSkeleton from '../components/HomeSourceSkeleton';
import HomeSourceTabsSkeleton from '../components/HomeSourceTabsSkeleton';
import { HOME_REMANGA } from '../mocks';
import { SECTION_STEP } from '../models';

const HOME = { ...HOME_REMANGA, blocks: HOME_REMANGA.blocks.slice(0, 3) };

/** Ось Z — скелетон секции, пока она грузится или не доехала до экрана. */
function SkeletonSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Z"
        title="Скелетон секции"
        description="Переключите «Загрузка / Ответ» — оба варианта меняются разом, видно, прыгает ли высота, когда приходят данные."
      />
      <SandboxOnly>
        <Group gap="sm">
          <Text fz="sm">Состояние секций</Text>
          <SegmentedControl
            value={isLoaded ? 'loaded' : 'loading'}
            onChange={(value) => setIsLoaded(value === 'loaded')}
            data={[
              { value: 'loading', label: 'Загрузка' },
              { value: 'loaded', label: 'Ответ' },
            ]}
          />
        </Group>
      </SandboxOnly>
      <DemoSection
        code="Z1"
        title="Ленты по включённым блокам"
        description="Для S1: блоки источника известны заранее (homeSections), поэтому скелетон рисует столько лент, сколько их включено, с настоящими названиями блоков; меняются только заголовок источника и обложки."
        pros={[
          'высота почти не прыгает: блоков столько же, сколько придёт',
          'названия блоков видны сразу — понятно, что грузится',
        ]}
        cons={[
          'если сайт сменил вёрстку и блок пришёл пустым, лента скелетона пропадёт — секция станет короче',
          'под S2 не подходит: там одна лента',
        ]}
      >
        <VariantFrames>
          {isLoaded ? (
            <HomeSourceSection home={HOME} />
          ) : (
            <HomeSourceSkeleton blocks={HOME.blocks} />
          )}
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="Z2"
        title="Под S2: плашки вместо чипов и одна лента"
        description="Заголовок источника, плашки на месте чипов — по числу включённых блоков, но сами названия тоже скелетоном, — и одна лента обложек. Высота секции до и после ответа одна и та же."
        pros={[
          'форма совпадает с S2 один в один — ничего не прыгает',
          'всё, что пришлёт сервер, одинаково серое: нет полуготового вида',
        ]}
        cons={['названия блоков известны заранее, а показываются только с ответом']}
      >
        <VariantFrames>
          {isLoaded ? (
            <HomeSourceSection home={HOME_REMANGA} step={SECTION_STEP.TABS} />
          ) : (
            <HomeSourceTabsSkeleton count={HOME_REMANGA.blocks.length} />
          )}
        </VariantFrames>
      </DemoSection>
    </Stack>
  );
}

export default SkeletonSection;
