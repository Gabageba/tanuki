import { useContext } from 'react';
import { Button, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CaretDownIcon } from '@phosphor-icons/react';
import { catalogEntryFor, type SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { stopCardClick } from '../lib';
import { PHONE_FRAME_CONTEXT } from '../models';
import SourcesDrawer from './SourcesDrawer';
import SourcesMenuItems from './SourcesMenuItems';
import styles from '../Bookmarks.module.scss';

type Props = {
  sourceIds: SourceId[];
  /** Q1b — на телефоне список выезжает снизу, а не открывается меню. */
  withDrawerOnPhone?: boolean;
};

/** Q1 — чип в рамке: иконка источника, «+N» и стрелка вниз — читается как кнопка со списком.
 *  Один источник — просто иконка, без рамки. */
function SourcesChip({ sourceIds, withDrawerOnPhone = false }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const [isDrawerOpened, drawer] = useDisclosure(false);
  const [lead, ...others] = sourceIds;

  if (!lead) return null;

  const leadTitle = catalogEntryFor(lead).title;

  if (others.length === 0) {
    return <SourceIcon id={lead} title={leadTitle} size={20} radius="sm" flex="none" />;
  }

  const chip = (
    <Button
      variant="default"
      size="compact-xs"
      radius="xl"
      h={24}
      pl={3}
      flex="none"
      ff="monospace"
      leftSection={<SourceIcon id={lead} title={leadTitle} size={18} radius="xl" />}
      rightSection={<CaretDownIcon size={10} />}
      aria-label="Другие источники"
      className={styles.hitArea}
      onClick={(event) => {
        stopCardClick(event);
        if (withDrawerOnPhone && isPhone) drawer.open();
      }}
    >
      +{others.length}
    </Button>
  );

  if (withDrawerOnPhone && isPhone) {
    return (
      <>
        {chip}
        <SourcesDrawer sourceIds={sourceIds} opened={isDrawerOpened} onClose={drawer.close} />
      </>
    );
  }

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>{chip}</Menu.Target>
      <Menu.Dropdown>
        <SourcesMenuItems sourceIds={sourceIds} />
      </Menu.Dropdown>
    </Menu>
  );
}

export default SourcesChip;
