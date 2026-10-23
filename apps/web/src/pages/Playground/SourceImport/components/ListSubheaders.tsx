import { Fragment } from 'react';
import { Box, Divider } from '@mantine/core';
import type { ImportSelection } from '../hooks/useImportSelection';
import type { SiteFolder, TitlesConfig } from '../models';
import FolderCheckbox from './FolderCheckbox';
import FolderItems from './FolderItems';
import styles from './ListSubheaders.module.scss';

type Props = {
  folders: SiteFolder[];
  selection: ImportSelection;
  config: TitlesConfig;
};

/** L3 — один сплошной список без рамок; папка — липкий подзаголовок с чекбоксом. */
function ListSubheaders({ folders, selection, config }: Props) {
  return (
    <Box>
      {folders.map((folder) => (
        <Fragment key={folder.id}>
          <Box className={styles.sticky} px="md" py="xs">
            <FolderCheckbox folder={folder} selection={selection} config={config} />
          </Box>
          <Divider />
          <FolderItems folder={folder} selection={selection} config={config} />
          <Divider />
        </Fragment>
      ))}
    </Box>
  );
}

export default ListSubheaders;
