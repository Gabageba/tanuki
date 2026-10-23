import { Fragment, useState } from 'react';
import { Button, Divider } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import type { ImportSelection } from '../hooks/useImportSelection';
import { splitImported } from '../lib';
import { IMPORTED_VIEW, type ImportItem, type SiteFolder, type TitlesConfig } from '../models';
import TitleRow from './TitleRow';

type Props = {
  folder: SiteFolder;
  selection: ImportSelection;
  config: TitlesConfig;
};

/** Строки одной папки сайта, разделённые линией. Уже импортированные — по оси A: в конце
 *  приглушёнными, свёрнутыми в одну строку или на своём месте с бейджем. */
function FolderItems({ folder, selection, config }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { fresh, imported } = splitImported(folder.items);
  const isCollapsible = config.imported === IMPORTED_VIEW.COLLAPSED && imported.length > 0;

  const getVisible = (): ImportItem[] => {
    switch (config.imported) {
      case IMPORTED_VIEW.BADGE:
        return folder.items;
      case IMPORTED_VIEW.DIMMED_LAST:
        return [...fresh, ...imported];
      case IMPORTED_VIEW.COLLAPSED:
        return isExpanded ? [...fresh, ...imported] : fresh;
    }
  };

  return (
    <>
      {getVisible().map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 && <Divider />}
          <TitleRow
            item={item}
            target={folder.target}
            config={config}
            checked={selection.isSelected(item.id)}
            onToggle={() => selection.toggle(item.id)}
          />
        </Fragment>
      ))}
      {isCollapsible && (
        <>
          <Divider />
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius={0}
            fullWidth
            justify="flex-start"
            px="md"
            h={36}
            leftSection={isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
            onClick={() => setIsExpanded((value) => !value)}
          >
            {isExpanded ? 'Свернуть уже импортированные' : `Ещё ${imported.length} уже в закладках`}
          </Button>
        </>
      )}
    </>
  );
}

export default FolderItems;
