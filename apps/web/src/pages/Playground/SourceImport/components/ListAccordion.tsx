import { Accordion, Group } from '@mantine/core';
import type { ImportSelection } from '../hooks/useImportSelection';
import type { SiteFolder, TitlesConfig } from '../models';
import FolderCheckbox from './FolderCheckbox';
import FolderItems from './FolderItems';

type Props = {
  folders: SiteFolder[];
  selection: ImportSelection;
  config: TitlesConfig;
};

/** L2 — группы свёрнуты: видны папки сайта со счётчиком, тайтлы — по раскрытию. Чекбокс папки
 *  работает и в свёрнутой группе. */
function ListAccordion({ folders, selection, config }: Props) {
  return (
    <Accordion variant="separated" multiple chevronPosition="right">
      {folders.map((folder) => (
        <Accordion.Item key={folder.id} value={folder.id}>
          <Accordion.Control px="md" py={4}>
            <Group wrap="nowrap">
              <FolderCheckbox folder={folder} selection={selection} config={config} />
            </Group>
          </Accordion.Control>
          <Accordion.Panel styles={{ content: { padding: 0 } }}>
            <FolderItems folder={folder} selection={selection} config={config} />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export default ListAccordion;
