import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { SEL_MANGALIB } from '../mocks';
import { BASE_LOOK, TABS_LOOK } from '../models';

/** Ось T — вид вкладок блоков; показано на MangaLib — у неё самые длинные названия. */
function TabsSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="T"
        title="Вид вкладок"
        description="Иконка у вкладки — по смыслу блока: новинки — искра, тренды — стрелка вверх, популярное — огонь, топ — кубок, обновления — часы. Названия — как у сайта. Показано на MangaLib: у неё шесть блоков и самые длинные названия."
      />
      <DemoSection
        code="T1"
        title="Вкладки с подчёркиванием"
        description="Обычные Tabs, как вкладки-папки закладок и вкладки настроек; строка листается вбок."
        pros={['Тот же вид, что у вкладок в остальном приложении', 'Тихие — не спорят с обложками']}
        cons={['Шесть длинных названий не помещаются даже на десктопе']}
      >
        <VariantFrames>
          <SelectionsMock look={BASE_LOOK} initialSourceId={SEL_MANGALIB.source.id} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="T2"
        title="Вкладки-пилюли"
        description="Tabs в виде капсул: выбранная залита основным цветом."
        pros={['Выбранный блок заметнее', 'Чуть компактнее по высоте']}
        cons={[
          'Похожи на чипы — с S0 два ряда капсул подряд',
          'Залитая капсула спорит с обложками за внимание',
        ]}
      >
        <VariantFrames>
          <SelectionsMock
            look={{ ...BASE_LOOK, tabs: TABS_LOOK.PILLS }}
            initialSourceId={SEL_MANGALIB.source.id}
          />
        </VariantFrames>
      </DemoSection>
    </Stack>
  );
}

export default TabsSection;
