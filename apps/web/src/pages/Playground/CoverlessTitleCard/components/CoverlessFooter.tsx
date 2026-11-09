import { Box, Group } from '@mantine/core';
import TitleScoreMeta from '@/entities/title/TitleScoreMeta';
import {
  FOLDER_MARK_POSITION,
  META_LAYOUT,
  type MetaLayout,
  type Example,
  type FolderDecoration,
} from '../models';
import CoverlessTags from './CoverlessTags/CoverlessTags';
import PlacedFolderDecoration from './PlacedFolderDecoration';

type Props = {
  example: Example;
  layout: MetaLayout;
  tagLines: number;
  folderDecoration?: FolderDecoration;
};

function CoverlessFooter({ example, layout, tagLines, folderDecoration }: Props) {
  const { title } = example;
  const hasFolderMark =
    folderDecoration?.position === FOLDER_MARK_POSITION.FOOTER && example.folder;
  if (
    !hasFolderMark &&
    title.tags.length === 0 &&
    (layout === META_LAYOUT.SEPARATE || title.likes === null)
  )
    return null;
  return (
    <Group gap={8} wrap="nowrap" justify="space-between" align="flex-end">
      <PlacedFolderDecoration
        folder={example.folder}
        decoration={folderDecoration}
        position={FOLDER_MARK_POSITION.FOOTER}
      />
      <Box flex={1} miw={0}>
        <CoverlessTags tags={title.tags} lines={tagLines} />
      </Box>
      {layout === META_LAYOUT.FOOTER && <TitleScoreMeta title={title} />}
    </Group>
  );
}

export default CoverlessFooter;
