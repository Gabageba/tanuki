import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import DemoSection from '../../components/DemoSection';
import TitlesStep from '../components/TitlesStep';
import { LIBRARY_EMPTY, LIBRARY_NOTHING_NEW, LIBRARY_OVER_LIMIT } from '../mocks';
import { BASE_CONFIG, MAPPING_VIEW } from '../models';

/** N — крайние случаи шага «Тайтлы» на базовой комбинации. */
function StatesSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="N"
        title="Состояния"
        description="Крайние случаи из плана на базе L1 + K1 + R2 + A1 + P0 + M1 — проверить тексты и что ничего не ломается. Папки сверх лимита — в M1 и M2 рядом."
      />
      <DemoSection
        code="N"
        title="Нового нет, закладок нет, папки не поместились"
        description="Повторный импорт, где всё уже в закладках: заметка над списком, всё снято, «Импорт» выключен до выбора. Пустой сайт — EmptyState вместо списка. Своих папок сайта больше лимита — их тайтлы с бейджем «В планах»."
      >
        <Group align="flex-start" gap="lg">
          <CaptionedFrame caption="Нового нет">
            <TitlesStep folders={LIBRARY_NOTHING_NEW} config={BASE_CONFIG} />
          </CaptionedFrame>
          <CaptionedFrame caption="На сайте закладок нет">
            <TitlesStep folders={LIBRARY_EMPTY} config={BASE_CONFIG} />
          </CaptionedFrame>
          <CaptionedFrame caption="Папки не поместились · M1">
            <TitlesStep folders={LIBRARY_OVER_LIMIT} config={BASE_CONFIG} />
          </CaptionedFrame>
          <CaptionedFrame caption="Папки не поместились · M2">
            <TitlesStep
              folders={LIBRARY_OVER_LIMIT}
              config={{ ...BASE_CONFIG, mapping: MAPPING_VIEW.GROUP_HEADER }}
            />
          </CaptionedFrame>
        </Group>
      </DemoSection>
    </Stack>
  );
}

export default StatesSection;
