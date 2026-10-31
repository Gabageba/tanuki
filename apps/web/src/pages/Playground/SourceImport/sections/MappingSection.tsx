import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import TitlesPair from '../components/TitlesPair';
import { LIBRARY_PREVIEW } from '../mocks';
import { MAPPING_VIEW } from '../models';

/** M — где сказать, в какую нашу папку ляжет папка сайта. */
function MappingSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="M"
        title="Папка сайта → наша"
        description="«Читаю» ляжет во встроенную, «Любимые» — в вашу папку с тем же именем, «Перечитать когда-нибудь летом…» создастся. Все тайтлы группы ложатся в одну папку. Остальное — база L1 + K1 + R2 + A1 + P0."
      />
      <DemoSection
        code="M1"
        title="Бейдж в каждой строке"
        description="Как в плане: у каждого тайтла — бейдж нашей папки в её цвете и с её иконкой."
        pros={[
          'Видно у самого тайтла, куда он ляжет',
          'Бейдж — тот же, что у папок в остальном приложении',
        ]}
        cons={[
          'Один и тот же бейдж повторяется 40 раз подряд',
          'Что папка создастся, а не совпала, по бейджу не понять',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ mapping: MAPPING_VIEW.ROW_BADGE }} />
      </DemoSection>
      <DemoSection
        code="M2"
        title="В шапке группы"
        description="Под названием папки сайта — «→ в „Читаю“», «→ в вашу папку „Любимые“», «→ создастся такая же папка». В строках бейджа нет."
        pros={['Сказано один раз на группу — строки чище', 'Видно, совпала папка или создастся']}
        cons={[
          'В L2 и L4 это видно только в обзоре папок',
          'Прокрутив вглубь группы, шапку уже не видно (кроме L3)',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ mapping: MAPPING_VIEW.GROUP_HEADER }} />
      </DemoSection>
      <DemoSection
        code="M3"
        title="Сводка папок над списком"
        description="Перед тайтлами — рамка «Папки»: каждая папка сайта, куда ляжет, иконкой и цветом нашей папки. В строках бейджа нет."
        pros={['Вся картина папок разом, до тайтлов', 'Строки чистые']}
        cons={[
          'Сводка оторвана от групп — сверять глазами',
          'Ещё одна рамка перед списком, на телефоне — полэкрана',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ mapping: MAPPING_VIEW.SUMMARY }} />
      </DemoSection>
    </Stack>
  );
}

export default MappingSection;
