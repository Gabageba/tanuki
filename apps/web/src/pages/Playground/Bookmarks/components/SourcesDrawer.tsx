import { Drawer, NavLink, Stack } from '@mantine/core';
import { catalogEntryFor, type SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  sourceIds: SourceId[];
  opened: boolean;
  onClose: () => void;
};

/** Q1b — источники группы снизу экрана, строками по 48 px: на телефоне пункт меню мелкий. */
function SourcesDrawer({ sourceIds, opened, onClose }: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      title="Открыть на источнике"
    >
      <Stack gap={0} pb="md">
        {sourceIds.map((sourceId) => {
          const { title } = catalogEntryFor(sourceId);

          return (
            <NavLink
              key={sourceId}
              href="#"
              h={48}
              label={title}
              leftSection={<SourceIcon id={sourceId} title={title} size={24} radius="sm" />}
              onClick={onClose}
            />
          );
        })}
      </Stack>
    </Drawer>
  );
}

export default SourcesDrawer;
