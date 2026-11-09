import { Group } from '@mantine/core';
import { CONTENT_RATING } from '@tanuki/contracts';
import TitleScoreMeta from '@/entities/title/TitleScoreMeta';
import TitleAdultTag from '@/entities/title/markers/TitleAdultTag';
import { FOLDER_MARK, META_LAYOUT, type CardOptions, type Example } from '../models';
import { getFolderPresentation } from '../lib';
import CoverlessFolderMark from './CoverlessFolderMark';

type Props = CardOptions & { example: Example };

function CoverlessMeta({
  example,
  folderMark = FOLDER_MARK.HEADING_NAME,
  folderDecoration,
  metaLayout = META_LAYOUT.FOOTER,
}: Props) {
  const { inHeading, withName } = getFolderPresentation(folderMark);
  const separate = metaLayout === META_LAYOUT.SEPARATE;
  const showFolder = !folderDecoration && !inHeading;
  if (
    (!showFolder || !example.folder) &&
    (!separate ||
      (example.title.likes === null && example.title.contentRating !== CONTENT_RATING.ADULT))
  )
    return null;

  return (
    <Group gap={8} justify="space-between" wrap="nowrap" miw={0}>
      <Group gap={8} miw={0} flex={1}>
        {separate && <TitleAdultTag contentRating={example.title.contentRating} />}
        {showFolder && <CoverlessFolderMark folder={example.folder} withName={withName} />}
      </Group>
      {separate && <TitleScoreMeta title={example.title} />}
    </Group>
  );
}

export default CoverlessMeta;
