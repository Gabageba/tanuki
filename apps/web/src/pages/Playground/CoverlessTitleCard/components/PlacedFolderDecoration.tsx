import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { FOLDER_MARK_POSITION, type FolderDecoration, type FolderMarkPosition } from '../models';
import CoverlessFolderDecoration from './CoverlessFolderDecoration';

type Props = {
  folder: ResolvedBookmarkFolder | null;
  decoration?: FolderDecoration;
  position: FolderMarkPosition;
};

function PlacedFolderDecoration({ folder, decoration, position }: Props) {
  if (!decoration || decoration.position !== position) return null;
  return (
    <CoverlessFolderDecoration
      folder={folder}
      appearance={decoration.appearance}
      alignWithTitle={position !== FOLDER_MARK_POSITION.FOOTER}
    />
  );
}

export default PlacedFolderDecoration;
