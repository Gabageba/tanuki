import { Skeleton, Stack } from '@mantine/core';
import { DEFAULT_PAGE_RATIO, SKELETON_PAGES_COUNT, READER_IMAGE_WIDTH_PROPS } from '../lib';

function ReaderPagesSkeleton() {
  return (
    <Stack mih="100vh" align="center">
      {Array.from({ length: SKELETON_PAGES_COUNT }).map((_, index) => (
        <Skeleton
          key={index}
          {...READER_IMAGE_WIDTH_PROPS}
          style={{ aspectRatio: DEFAULT_PAGE_RATIO }}
        />
      ))}
    </Stack>
  );
}

export default ReaderPagesSkeleton;
