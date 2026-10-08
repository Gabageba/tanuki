import { Avatar, Menu, Text, UnstyledButton } from '@mantine/core';
import { catalogEntryFor, type SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { stopCardClick } from '../lib';
import SourcesMenuItems from './SourcesMenuItems';
import styles from '../Bookmarks.module.scss';

type Props = {
  sourceIds: SourceId[];
};

const SIZE = 20;

/** Q0 — как сейчас в приложении: иконка источника и наложенный на неё «+N», как у
 *  `Avatar.Group`; по нажатию — меню. */
function SourcesOverlapButton({ sourceIds }: Props) {
  const [lead, ...others] = sourceIds;

  if (!lead) return null;

  const leadIcon = (
    <SourceIcon id={lead} title={catalogEntryFor(lead).title} size={SIZE} radius="sm" flex="none" />
  );

  if (others.length === 0) return leadIcon;

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <UnstyledButton
          onClick={stopCardClick}
          aria-label="Другие источники"
          flex="none"
          className={styles.hitArea}
        >
          <Avatar.Group spacing={SIZE / 3}>
            {leadIcon}
            <Avatar size={SIZE} radius="sm">
              <Text span fz={SIZE / 2} ff="monospace">
                +{others.length}
              </Text>
            </Avatar>
          </Avatar.Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <SourcesMenuItems sourceIds={sourceIds} />
      </Menu.Dropdown>
    </Menu>
  );
}

export default SourcesOverlapButton;
