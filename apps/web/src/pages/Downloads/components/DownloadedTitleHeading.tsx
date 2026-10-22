import { Group, Image, Stack, Text } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';
import { getDownloadedCoverUrl } from '../lib';
import type { DownloadedTitle } from '../models';
import DownloadedTitleMeta from './DownloadedTitleMeta';

type Props = {
  title: DownloadedTitle;
  sourceName: string | undefined;
};

/** Обложка 40 px, название в одну строку и мета скачанного тайтла. */
function DownloadedTitleHeading({ title, sourceName }: Props) {
  const name = title.snapshot?.details.title.name;

  return (
    <Group gap="sm" wrap="nowrap" miw={0} flex={1}>
      <Image
        src={getDownloadedCoverUrl(title.snapshot)}
        alt={name}
        w={40}
        h={56}
        radius="sm"
        flex="none"
      />
      <Stack gap={2} miw={0} flex={1}>
        <Text fz="sm" truncate="end">
          {name ?? <Mdash />}
        </Text>
        <DownloadedTitleMeta
          sourceName={sourceName}
          count={title.chapters.length}
          bytes={title.bytes}
        />
      </Stack>
    </Group>
  );
}

export default DownloadedTitleHeading;
