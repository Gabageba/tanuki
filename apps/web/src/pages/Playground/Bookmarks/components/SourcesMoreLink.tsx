import { Anchor, Group, Menu } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import type { SourceId } from '@tanuki/contracts';
import { stopCardClick } from '../lib';
import SourcesMenuItems from './SourcesMenuItems';
import styles from '../Bookmarks.module.scss';

type Props = {
  sourceIds: SourceId[];
};

/** Q2 — «ещё N ▾» словами в конце мета-строки: иконка источника остаётся частью карточки, а
 *  меню открывает отдельная ссылка. */
function SourcesMoreLink({ sourceIds }: Props) {
  const othersCount = sourceIds.length - 1;

  if (othersCount < 1) return null;

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Anchor
          component="button"
          type="button"
          fz="inherit"
          lh="inherit"
          onClick={stopCardClick}
          className={styles.hitArea}
        >
          <Group component="span" gap={2} wrap="nowrap">
            ещё {othersCount}
            <CaretDownIcon size={10} />
          </Group>
        </Anchor>
      </Menu.Target>
      <Menu.Dropdown>
        <SourcesMenuItems sourceIds={sourceIds} />
      </Menu.Dropdown>
    </Menu>
  );
}

export default SourcesMoreLink;
