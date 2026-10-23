import { Badge, Checkbox, Group, Stack } from '@mantine/core';
import { BUILT_IN_BOOKMARK_FOLDER } from '@tanuki/contracts';
import type { ImportSelection } from '../hooks/useImportSelection';
import { getBuiltInLabel } from '../lib';
import { FOLDER_MAPPING, ITEM_STATE, type SiteFolder } from '../models';

type Props = {
  folders: SiteFolder[];
  selection: ImportSelection;
};

/** L0 — как в заглушке: плоский список, у строки серый бейдж статуса, папок сайта нет. Свои папки
 *  сайта заглушка не знает — их тайтлы у неё «В планах». */
function ListFlat({ folders, selection }: Props) {
  return (
    <Stack gap="sm">
      {folders.flatMap((folder) =>
        folder.items.map((item) => (
          <Group key={item.id} justify="space-between" wrap="nowrap" align="flex-start">
            <Checkbox
              checked={selection.isSelected(item.id)}
              onChange={() => selection.toggle(item.id)}
              label={item.name}
              description={
                item.state === ITEM_STATE.NEW
                  ? null
                  : 'Уже в закладках — добавится как ещё один источник'
              }
            />
            <Badge variant="default" size="sm" flex="none">
              {folder.mapping === FOLDER_MAPPING.BUILT_IN
                ? folder.target.name
                : getBuiltInLabel(BUILT_IN_BOOKMARK_FOLDER.PLANNED)}
            </Badge>
          </Group>
        )),
      )}
    </Stack>
  );
}

export default ListFlat;
