import { Box, Stack, Text } from '@mantine/core';
import CoverImage from '@/shared/ui/CoverImage';
import { getMockCoverUrl } from '../../Bookmarks/lib';
import { formatChaptersCount } from '../lib';
import type { MockDownloadedTitle } from '../models';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  title: MockDownloadedTitle;
};

/** Карточка скачанного тайтла в каталоге и поиске без сети — та же сетка, что онлайн. */
function OfflineTitleCard({ title }: Props) {
  return (
    <Stack gap={4}>
      <Box className={titleStyles.imageWrapper}>
        <CoverImage
          src={getMockCoverUrl(title.coverSeed)}
          alt={title.name}
          className={titleStyles.image}
        />
      </Box>
      <Text fz="sm" lineClamp={2} lh="tight">
        {title.name}
      </Text>
      <Text fz={12} c="dimmed" ff="monospace">
        {formatChaptersCount(title.chapters.length)}
      </Text>
    </Stack>
  );
}

export default OfflineTitleCard;
