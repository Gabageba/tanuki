import { Box, Menu, Text, UnstyledButton } from '@mantine/core';
import { catalogEntryFor, type SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { stopCardClick } from '../lib';
import styles from '../Bookmarks.module.scss';

type Props = {
  /** Первый — источник, куда ведёт карточка. */
  sourceIds: SourceId[];
  size?: number;
};

/**
 * Иконка источника, куда ведёт карточка, и «+N» в углу, если в группе есть ещё — как
 * `LinkedMarksIcon` в списке глав (A2e). Один источник — просто иконка, без меню.
 */
function SourcesButton({ sourceIds, size = 18 }: Props) {
  const [lead, ...others] = sourceIds;

  if (!lead) return null;

  const leadTitle = catalogEntryFor(lead).title;
  const icon = (
    <Box pos="relative" flex="none" className={styles.sourceIcon}>
      <SourceIcon id={lead} title={leadTitle} size={size} radius="sm" />
      {others.length > 0 && (
        <Box component="span" ff="monospace" className={styles.sourceCount}>
          +{others.length}
        </Box>
      )}
    </Box>
  );

  if (others.length === 0) return icon;

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <UnstyledButton onClick={stopCardClick} aria-label="Другие источники">
          {icon}
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Открыть на источнике</Menu.Label>
        {sourceIds.map((sourceId) => {
          const { title } = catalogEntryFor(sourceId);

          return (
            <Menu.Item
              key={sourceId}
              leftSection={<SourceIcon id={sourceId} title={title} size={18} radius="sm" />}
            >
              <Text inherit>{title}</Text>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}

export default SourcesButton;
