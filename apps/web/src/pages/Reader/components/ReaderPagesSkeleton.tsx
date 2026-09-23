import { Skeleton, Stack } from '@mantine/core';
import { DEFAULT_PAGE_RATIO, SKELETON_PAGES_COUNT, READER_CONTENT_MIN_HEIGHT } from '../lib';

type Props = {
  containerWidth: number;
};

function ReaderPagesSkeleton({ containerWidth }: Props) {
  return (
    <Stack mih={READER_CONTENT_MIN_HEIGHT} align="center">
      {Array.from({ length: SKELETON_PAGES_COUNT }).map((_, index) => (
        <Skeleton
          key={index}
          w="100%"
          maw={containerWidth}
          style={{ aspectRatio: DEFAULT_PAGE_RATIO }}
          radius={0}
        />
      ))}
    </Stack>
  );
}

export default ReaderPagesSkeleton;
