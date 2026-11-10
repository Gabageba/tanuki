import { Box, Divider, Group } from '@mantine/core';
import { CONTENT_RATING } from '@tanuki/contracts';
import TitleAdultTag from '@/entities/title/markers/TitleAdultTag';
import TitleCardFolderTag from '@/entities/title/card/TitleCard/components/TitleCardFolderTag';
import TitleCardMetaRow from '@/entities/title/card/TitleCard/components/TitleCardMetaRow';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import { META_VARIANT, type ChapterExample, type MetaVariant } from '../models';
import NewChapterSourceMeta from './NewChapterSourceMeta';

type Props = { example: ChapterExample; variant: MetaVariant; folderId: string };

function NewChapterMetaRow({ example, variant, folderId }: Props) {
  const { bookmark, folder } = example;
  const source = <NewChapterSourceMeta {...example} />;
  const marker = (
    <TitleCardFolderTag folder={folder} to={getTitleCardPath(bookmark.titleId)} id={folderId} />
  );
  const getSlots = () => {
    switch (variant) {
      case META_VARIANT.CURRENT:
        return { meta: source, markers: marker };
      case META_VARIANT.SEPARATOR:
        return {
          meta: <Box pl={folder ? 4 : 0}>{source}</Box>,
          markers: folder && (
            <Group gap={10} wrap="nowrap">
              {marker}
              <Divider orientation="vertical" h={14} my="auto" />
            </Group>
          ),
        };
      case META_VARIANT.TEXT_SOURCE:
        return { meta: <NewChapterSourceMeta {...example} showIcon={false} />, markers: marker };
      case META_VARIANT.FOLDER_RIGHT:
        return {
          meta: source,
          contentRating: CONTENT_RATING.SAFE,
          actions: (
            <>
              {marker}
              <TitleAdultTag contentRating={bookmark.contentRating} />
            </>
          ),
        };
    }
  };

  return <TitleCardMetaRow contentRating={bookmark.contentRating} {...getSlots()} />;
}

export default NewChapterMetaRow;
