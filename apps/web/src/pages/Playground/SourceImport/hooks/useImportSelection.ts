import { useState } from 'react';
import { countItems, getDefaultSelection } from '../lib';
import type { SiteFolder } from '../models';

export type ImportSelection = {
  selected: Set<string>;
  total: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Сколько выбрано в папке. */
  countInFolder: (folder: SiteFolder) => number;
  toggleFolder: (folder: SiteFolder) => void;
  toggleAll: () => void;
};

/** Выбор тайтлов на шаге «Тайтлы»: по умолчанию всё, кроме уже импортированного. */
function useImportSelection(folders: SiteFolder[]): ImportSelection {
  const [selected, setSelected] = useState(() => new Set(getDefaultSelection(folders)));
  const total = countItems(folders);

  const countInFolder = (folder: SiteFolder) =>
    folder.items.filter((item) => selected.has(item.id)).length;

  const setMany = (ids: string[], isOn: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) => (isOn ? next.add(id) : next.delete(id)));
      return next;
    });

  return {
    selected,
    total,
    isSelected: (id) => selected.has(id),
    toggle: (id) => setMany([id], !selected.has(id)),
    countInFolder,
    toggleFolder: (folder) =>
      setMany(
        folder.items.map(({ id }) => id),
        countInFolder(folder) < folder.items.length,
      ),
    toggleAll: () =>
      setMany(
        folders.flatMap((folder) => folder.items.map(({ id }) => id)),
        selected.size < total,
      ),
  };
}

export default useImportSelection;
