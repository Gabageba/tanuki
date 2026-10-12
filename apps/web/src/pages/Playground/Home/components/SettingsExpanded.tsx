import { Checkbox, Switch } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import useHomeSettingsMock from '../hooks/useHomeSettingsMock';
import { SETTINGS_BLOCKS, type HomeSource, type SettingsBlocks } from '../models';
import HomeSettingsRow from './HomeSettingsRow';
import SettingsBlockList from './SettingsBlockList';

type Props = {
  homes: HomeSource[];
  blocksLayout?: SettingsBlocks;
  /** Итог — вкладка «Подборки»: переключатель «Показывать в подборках». */
  isSelectionsTab?: boolean;
};

/** T1 — у источника переключатель «Показывать на главной», под ним галочки блоков. Выключен
 *  источник — галочки гаснут, но выбор в них сохраняется. */
function SettingsExpanded({
  homes,
  blocksLayout = SETTINGS_BLOCKS.WRAP,
  isSelectionsTab = false,
}: Props) {
  const { isSourceOn, isBlockOn, setSourceOn, setBlockOn } = useHomeSettingsMock();

  return (
    <GroupedList label="Источники">
      {homes.map(({ source, blocks }) => (
        <HomeSettingsRow
          key={source.id}
          source={source}
          action={
            <Switch
              checked={isSourceOn(source.id)}
              onChange={(event) => setSourceOn(source.id, event.currentTarget.checked)}
              aria-label={`Показывать ${source.title} ${isSelectionsTab ? 'в подборках' : 'на главной'}`}
            />
          }
        >
          <SettingsBlockList layout={blocksLayout}>
            {blocks.map((block) => (
              <Checkbox
                key={block.id}
                size="xs"
                label={block.title}
                disabled={!isSourceOn(source.id)}
                checked={isBlockOn(source.id, block.id)}
                onChange={(event) => setBlockOn(source.id, block.id, event.currentTarget.checked)}
              />
            ))}
          </SettingsBlockList>
        </HomeSettingsRow>
      ))}
    </GroupedList>
  );
}

export default SettingsExpanded;
