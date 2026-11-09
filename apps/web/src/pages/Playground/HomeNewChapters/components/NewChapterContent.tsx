import { useId } from 'react';
import { Group } from '@mantine/core';
import { generatePath } from 'react-router';
import TitleCardFolderTag from '@/entities/title/card/TitleCard/components/TitleCardFolderTag';
import TitleCardMetaRow from '@/entities/title/card/TitleCard/components/TitleCardMetaRow';
import TitleCardName from '@/entities/title/card/TitleCard/components/TitleCardName/TitleCardName';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { CARD_VARIANT, type ChapterExample } from '../models';
import NewChapterDetails from './NewChapterDetails';
import NewChapterSourceMeta from './NewChapterSourceMeta';

type Props = {
  example: ChapterExample;
  variant: typeof CARD_VARIANT.COMPACT | typeof CARD_VARIANT.TITLE_FIRST;
};

function NewChapterContent({ example, variant }: Props) {
  const folderId = useId();
  const { bookmark, folder } = example;
  const source = <NewChapterSourceMeta {...example} />;
  const marker = (
    <TitleCardFolderTag
      folder={folder}
      to={generatePath(ROUTE_PATHS.TITLE, { titleId: bookmark.titleId })}
      id={folderId}
    />
  );
  const name = <TitleCardName data={{ ...bookmark, id: bookmark.titleId }} />;

  switch (variant) {
    case CARD_VARIANT.COMPACT:
      return (
        <>
          <TitleCardMetaRow meta={source} markers={marker} contentRating={bookmark.contentRating} />
          {name}
          <NewChapterDetails bookmark={bookmark} />
        </>
      );
    case CARD_VARIANT.TITLE_FIRST:
      return (
        <>
          <TitleCardMetaRow meta={name} contentRating={bookmark.contentRating} />
          <Group gap={6} wrap="nowrap" miw={0} mih={20}>
            {marker}
            {source}
          </Group>
          <NewChapterDetails bookmark={bookmark} />
        </>
      );
  }
}

export default NewChapterContent;
