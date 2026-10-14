import { Checkbox, Flex } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import useHomeSettingsMock from '../hooks/useHomeSettingsMock';
import type { HomeSource } from '../models';
import HomeSettingsRow from './HomeSettingsRow';

type Props = {
  homes: HomeSource[];
};

/** T4 — без переключателя: источник на главной, пока отмечен хоть один его блок. Справа галочка
 *  «все» — полупустая, когда отмечена часть. Отдельного «Показывать на главной» из плана нет. */
function SettingsCheckboxes({ homes }: Props) {
  const { isBlockOn, setBlockOn, setEnabledBlocks } = useHomeSettingsMock();

  return (
    <GroupedList label="Источники">
      {homes.map(({ source, blocks }) => {
        const allIds = blocks.map((block) => block.id);
        const enabledCount = allIds.filter((id) => isBlockOn(source.id, id)).length;

        return (
          <HomeSettingsRow
            key={source.id}
            source={source}
            action={
              <Checkbox
                aria-label={`Все подборки ${source.title}`}
                checked={enabledCount === allIds.length}
                indeterminate={enabledCount > 0 && enabledCount < allIds.length}
                onChange={() =>
                  setEnabledBlocks(source.id, allIds, enabledCount === allIds.length ? [] : allIds)
                }
              />
            }
          >
            <Flex wrap="wrap" columnGap="md" rowGap={8}>
              {blocks.map((block) => (
                <Checkbox
                  key={block.id}
                  size="xs"
                  label={block.title}
                  checked={isBlockOn(source.id, block.id)}
                  onChange={(event) => setBlockOn(source.id, block.id, event.currentTarget.checked)}
                />
              ))}
            </Flex>
          </HomeSettingsRow>
        );
      })}
    </GroupedList>
  );
}

export default SettingsCheckboxes;
