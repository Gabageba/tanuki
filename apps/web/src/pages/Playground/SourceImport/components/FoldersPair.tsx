import { Group } from '@mantine/core';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import type { FoldersView, SiteFolder } from '../models';
import FoldersStep from './FoldersStep';

type Props = {
  folders: SiteFolder[];
  view: FoldersView;
};

/** Шаг «Папки» рядом в двух ширинах: десктоп 440 и телефон 375. */
function FoldersPair({ folders, view }: Props) {
  return (
    <Group align="flex-start" gap="lg">
      <CaptionedFrame caption="Десктоп · 440 px">
        <FoldersStep folders={folders} view={view} />
      </CaptionedFrame>
      <CaptionedFrame caption="Телефон · 375 px">
        <FoldersStep folders={folders} view={view} isPhone />
      </CaptionedFrame>
    </Group>
  );
}

export default FoldersPair;
