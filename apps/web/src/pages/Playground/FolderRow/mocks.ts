import { MOCK_FOLDERS } from '../Bookmarks/mocks';
import type { MockFolder } from '../Bookmarks/models';

const getFolder = (id: string) => MOCK_FOLDERS.find((folder) => folder.id === id) as MockFolder;

/** Свои вперемешку со встроенными, у одной — длинное название. */
export const MIXED_FOLDERS: MockFolder[] = [
  getFolder('reading'),
  getFolder('favorites'),
  getFolder('planned'),
  getFolder('completed'),
  getFolder('reread'),
  getFolder('dropped'),
];

/** Своих папок нет — самый частый случай. */
export const BUILT_IN_FOLDERS: MockFolder[] = MOCK_FOLDERS.filter(
  ({ builtIn }) => builtIn !== null,
);
