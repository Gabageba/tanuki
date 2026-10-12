import { useContext } from 'react';
import { Group, Switch } from '@mantine/core';
import { ListChecksIcon } from '@phosphor-icons/react';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import GroupedList from '@/shared/ui/GroupedList';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import useHomeSettingsMock from '../hooks/useHomeSettingsMock';
import type { HomeSource } from '../models';
import HomeSettingsRow from './HomeSettingsRow';

type Props = {
  homes: HomeSource[];
};

/** T3 — одна строка на источник: блоки в `CompactMultiSelect` («Горячие новинки +3») и
 *  переключатель. На телефоне поле не влезает в строку и уходит под неё. */
function SettingsMultiselect({ homes }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const { isSourceOn, isBlockOn, setSourceOn, setEnabledBlocks } = useHomeSettingsMock();

  return (
    <GroupedList label="Источники">
      {homes.map(({ source, blocks }) => {
        const allIds = blocks.map((block) => block.id);
        const select = (
          <CompactMultiSelect
            aria-label={`Подборки ${source.title}`}
            placeholder="Подборки не выбраны"
            leftSection={<ListChecksIcon />}
            data={blocks.map((block) => ({ value: block.id, label: block.title }))}
            value={allIds.filter((id) => isBlockOn(source.id, id))}
            onChange={(next) => setEnabledBlocks(source.id, allIds, next)}
            disabled={!isSourceOn(source.id)}
            w={isPhone ? '100%' : 240}
            size="xs"
          />
        );
        const toggle = (
          <Switch
            checked={isSourceOn(source.id)}
            onChange={(event) => setSourceOn(source.id, event.currentTarget.checked)}
            aria-label={`Показывать ${source.title} на главной`}
          />
        );

        return (
          <HomeSettingsRow
            key={source.id}
            source={source}
            action={
              isPhone ? (
                toggle
              ) : (
                <Group gap="md" wrap="nowrap">
                  {select}
                  {toggle}
                </Group>
              )
            }
          >
            {isPhone && select}
          </HomeSettingsRow>
        );
      })}
    </GroupedList>
  );
}

export default SettingsMultiselect;
