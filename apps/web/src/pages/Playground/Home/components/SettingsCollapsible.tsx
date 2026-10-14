import { useState } from 'react';
import { Checkbox, Group, Stack, Switch, Text, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import useHomeSettingsMock from '../hooks/useHomeSettingsMock';
import type { HomeSource } from '../models';
import HomeSettingsRow from './HomeSettingsRow';

type Props = {
  homes: HomeSource[];
};

/** T2 — блоки спрятаны: под названием «4 из 6 подборок» с каретом, нажатие раскрывает галочки
 *  столбиком. `CollapsibleGroup` из shared — это обрезка ряда с «ещё», а не раскрытие, поэтому
 *  он здесь не подходит. */
function SettingsCollapsible({ homes }: Props) {
  const { isSourceOn, isBlockOn, setSourceOn, setBlockOn } = useHomeSettingsMock();
  const [openedIds, setOpenedIds] = useState<string[]>([]);

  const toggleOpened = (sourceId: string) =>
    setOpenedIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId],
    );

  return (
    <GroupedList label="Источники">
      {homes.map(({ source, blocks }) => {
        const isOpened = openedIds.includes(source.id);
        const enabledCount = blocks.filter((block) => isBlockOn(source.id, block.id)).length;

        return (
          <HomeSettingsRow
            key={source.id}
            source={source}
            description={
              <UnstyledButton onClick={() => toggleOpened(source.id)} aria-expanded={isOpened}>
                <Group gap={4} wrap="nowrap">
                  <Text fz={12} lh="tight" c="dimmed">
                    <Text span inherit ff="monospace">
                      {enabledCount} из {blocks.length}
                    </Text>{' '}
                    подборок
                  </Text>
                  {isOpened ? <CaretDownIcon size={12} /> : <CaretRightIcon size={12} />}
                </Group>
              </UnstyledButton>
            }
            action={
              <Switch
                checked={isSourceOn(source.id)}
                onChange={(event) => setSourceOn(source.id, event.currentTarget.checked)}
                aria-label={`Показывать ${source.title} на главной`}
              />
            }
          >
            {isOpened && (
              <Stack gap={8} pb={4}>
                {blocks.map((block) => (
                  <Checkbox
                    key={block.id}
                    size="xs"
                    label={block.title}
                    disabled={!isSourceOn(source.id)}
                    checked={isBlockOn(source.id, block.id)}
                    onChange={(event) =>
                      setBlockOn(source.id, block.id, event.currentTarget.checked)
                    }
                  />
                ))}
              </Stack>
            )}
          </HomeSettingsRow>
        );
      })}
    </GroupedList>
  );
}

export default SettingsCollapsible;
