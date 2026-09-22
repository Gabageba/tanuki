import { Skeleton, Stack } from '@mantine/core';
import {
  DEFAULT_PAGE_RATIO,
  SKELETON_PAGES_COUNT,
  READER_IMAGE_WIDTH_PROPS,
  READER_CONTENT_MIN_HEIGHT,
} from '../lib';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';

function ReaderPagesSkeleton() {
  return (
    <Stack mih={READER_CONTENT_MIN_HEIGHT} align="center" mt={HEADER_HEIGHT}>
      {Array.from({ length: SKELETON_PAGES_COUNT }).map((_, index) => (
        <Skeleton
          key={index}
          {...READER_IMAGE_WIDTH_PROPS}
          style={{ aspectRatio: DEFAULT_PAGE_RATIO }}
          radius={0}
        />
      ))}
    </Stack>
  );
}

export default ReaderPagesSkeleton;
