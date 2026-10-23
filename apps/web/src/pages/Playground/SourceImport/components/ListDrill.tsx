import { Fragment } from 'react';
import { Divider, Group, Paper, UnstyledButton } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { ImportSelection } from '../hooks/useImportSelection';
import type { SiteFolder, TitlesConfig } from '../models';
import FolderCheckbox from './FolderCheckbox';
import FolderItems from './FolderItems';

type Props = {
  folders: SiteFolder[];
  selection: ImportSelection;
  config: TitlesConfig;
  /** Открытая папка — тогда вместо обзора её тайтлы, заголовок модалки и «назад» ведёт шаг. */
  openFolder: SiteFolder | null;
  onOpenFolder: (folder: SiteFolder) => void;
};

/** L4 — обзор папок сайта с чекбоксами; тайтлы папки — внутренним экраном по клику на строку. */
function ListDrill({ folders, selection, config, openFolder, onOpenFolder }: Props) {
  if (openFolder) {
    return (
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <FolderItems folder={openFolder} selection={selection} config={config} />
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      {folders.map((folder, index) => (
        <Fragment key={folder.id}>
          {index > 0 && <Divider />}
          <UnstyledButton
            component="div"
            w="100%"
            px="md"
            py="xs"
            onClick={() => onOpenFolder(folder)}
          >
            <Group gap="sm" wrap="nowrap">
              <FolderCheckbox folder={folder} selection={selection} config={config} />
              <CaretRightIcon color="var(--mantine-color-dimmed)" style={{ flex: 'none' }} />
            </Group>
          </UnstyledButton>
        </Fragment>
      ))}
    </Paper>
  );
}

export default ListDrill;
