import { Flex, Skeleton, Stack } from '@mantine/core';
import { DEFAULT_PAGE_RATIO, SKELETON_PAGES_COUNT, READER_CONTENT_MIN_HEIGHT } from '../lib';

type Props = {
  containerWidth: number;
  horizontal?: boolean;
  pageStep?: number;
};

function ReaderPagesSkeleton({ containerWidth, horizontal = false, pageStep = 1 }: Props) {
  if (horizontal)
    return (
      <Flex mih="100dvh" justify="center" align="flex-start" gap={0}>
        {Array.from({ length: pageStep }, (_, index) => (
          <Skeleton
            key={index}
            radius={0}
            w={`min(${100 / pageStep}%, calc(100dvh * ${DEFAULT_PAGE_RATIO}))`}
            style={{ aspectRatio: DEFAULT_PAGE_RATIO }}
          />
        ))}
      </Flex>
    );
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
