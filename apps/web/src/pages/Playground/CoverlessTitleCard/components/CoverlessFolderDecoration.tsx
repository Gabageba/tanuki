import { Center, Tooltip } from '@mantine/core';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import type { FolderMarkAppearance } from '../models';
import { getFolderDecorationSize } from '../lib';
import FolderDecorationContent from './FolderDecorationContent';

type Props = {
  folder: ResolvedBookmarkFolder | null;
  appearance: FolderMarkAppearance;
  alignWithTitle?: boolean;
};

function CoverlessFolderDecoration({ folder, appearance, alignWithTitle = false }: Props) {
  if (!folder) return null;
  const size = getFolderDecorationSize(appearance);

  return (
    <Tooltip label={folder.name} withArrow>
      <Center
        data-folder-decoration={appearance}
        pos="relative"
        w={size}
        h={alignWithTitle ? '1lh' : size}
        fz="sm"
        lh="tight"
        flex="none"
      >
        <FolderDecorationContent folder={folder} appearance={appearance} />
      </Center>
    </Tooltip>
  );
}

export default CoverlessFolderDecoration;
