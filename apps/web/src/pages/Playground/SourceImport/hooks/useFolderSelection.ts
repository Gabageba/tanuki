import { useState } from 'react';
import { countFresh } from '../lib';
import type { SiteFolder } from '../models';

export type FolderSelection = {
  isSelected: (folder: SiteFolder) => boolean;
  toggle: (folder: SiteFolder) => void;
  toggleAll: () => void;
  folderCount: number;
  /** Сколько нового ляжет из выбранных папок. */
  titleCount: number;
  isAll: boolean;
  /** Есть ли что выбирать — в папках без нового чекбокс выключен. */
  hasSelectable: boolean;
};

/** Выбор на шаге «Папки»: по умолчанию все папки, где есть новое. */
function useFolderSelection(folders: SiteFolder[]): FolderSelection {
  const selectable = folders.filter((folder) => countFresh(folder) > 0);
  const [selected, setSelected] = useState(() => new Set(selectable.map(({ id }) => id)));
  const chosen = selectable.filter((folder) => selected.has(folder.id));
  const isAll = selectable.length > 0 && chosen.length === selectable.length;

  return {
    isSelected: (folder) => selected.has(folder.id),
    toggle: (folder) =>
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(folder.id)) {
          next.delete(folder.id);
        } else {
          next.add(folder.id);
        }
        return next;
      }),
    toggleAll: () => setSelected(new Set(isAll ? [] : selectable.map(({ id }) => id))),
    folderCount: chosen.length,
    titleCount: chosen.reduce((total, folder) => total + countFresh(folder), 0),
    isAll,
    hasSelectable: selectable.length > 0,
  };
}

export default useFolderSelection;
