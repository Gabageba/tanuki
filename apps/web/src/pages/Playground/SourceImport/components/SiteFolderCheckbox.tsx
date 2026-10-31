import { Checkbox } from '@mantine/core';
import type { FolderSelection } from '../hooks/useFolderSelection';
import { countFresh } from '../lib';
import type { SiteFolder } from '../models';

type Props = {
  folder: SiteFolder;
  selection: FolderSelection;
};

/** Чекбокс папки сайта; в папке без нового выключен — выбирать там нечего. */
function SiteFolderCheckbox({ folder, selection }: Props) {
  return (
    <Checkbox
      aria-label={`Папка «${folder.name}»`}
      checked={selection.isSelected(folder)}
      disabled={countFresh(folder) === 0}
      onChange={() => selection.toggle(folder)}
    />
  );
}

export default SiteFolderCheckbox;
