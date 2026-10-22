import { Group, Image, Stack, Text } from '@mantine/core';
import { getMockCoverUrl } from '../../Bookmarks/lib';
import type { MockDownloadedTitle } from '../models';
import DownloadedTitleMeta from './DownloadedTitleMeta';

type Props = {
  title: MockDownloadedTitle;
};

/** Обложка 40 px, название в одну строку и мета скачанного тайтла. */
function DownloadedTitleHeading({ title }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" miw={0} flex={1}>
      <Image src={getMockCoverUrl(title.coverSeed)} w={40} h={56} radius="sm" flex="none" />
      <Stack gap={2} miw={0} flex={1}>
        <Text fz="sm" truncate="end">
          {title.name}
        </Text>
        <DownloadedTitleMeta title={title} />
      </Stack>
    </Group>
  );
}

export default DownloadedTitleHeading;
