import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../../Notifications/components/AxisHeading';
import FolderSettingsMock from '../components/FolderSettingsMock';
import VariantStates from '../components/VariantStates';
import { ROW_VARIANT } from '../models';

/** Итог — выбранный вариант. */
function SummarySection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="★"
        title="Итог"
        description="Строка остаётся как в F1; меняется только место под меню у встроенных."
      />
      <DemoSection
        code="V0a"
        title="Как сейчас, без отступа у одних встроенных"
        description="Тумблер, за ним «⋯» у своих. Место под меню у встроенных держится, только когда в списке есть своя папка, — тогда тумблеры стоят колонкой. Если своих нет, тумблеры у всех прижаты к правому краю."
        pros={[
          'Тумблеры колонкой в любом списке',
          'В частом случае — одни встроенные — справа нет дыры',
          'Строка и меню без изменений, правка в одном месте',
        ]}
        cons={[
          'Со своими папками у встроенных пустое место остаётся',
          'Тумблер встроенных сдвигается влево, когда появляется первая своя папка',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <FolderSettingsMock folders={folders} blocks={[ROW_VARIANT.CURRENT_COMPACT]} />
          )}
        />
      </DemoSection>
    </Stack>
  );
}

export default SummarySection;
