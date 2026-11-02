import { Box, Skeleton } from '@mantine/core';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import type { Page, ReaderSettings } from '@tanuki/contracts';
import { DEFAULT_PAGE_RATIO, getReaderImageDimensionProps } from '../lib';
import ReaderPageImage from './ReaderPageImage';

type Props = {
  page: Page;
  chapterId: string;
  settings: ReaderSettings;
  ratio?: number;
  showImage: boolean;
  spread?: boolean;
  pagesLength: number;
  onMeasure: (key: string, ratio: number) => void;
  transform?: string;
  ref?: Ref<HTMLDivElement>;
};

function ReaderPageSlot({
  page,
  chapterId,
  settings,
  ratio: measuredRatio,
  showImage,
  spread = false,
  pagesLength,
  onMeasure,
  transform,
  ref,
}: Props) {
  const { t } = useTranslation();
  const key = `${chapterId}#${page.index}`;
  const ratio =
    measuredRatio ?? (page.width && page.height ? page.width / page.height : DEFAULT_PAGE_RATIO);
  const dimensions = spread
    ? { w: `min(50%, calc(100dvh * ${ratio}))`, h: 'auto' }
    : getReaderImageDimensionProps(settings.pageFit, settings.containerWidth, ratio);
  return (
    <Box
      ref={ref}
      data-chapter-id={chapterId}
      data-page-index={page.index}
      data-reader-page-key={key}
      pos="relative"
      style={{ aspectRatio: ratio, flexShrink: 0 }}
      {...dimensions}
    >
      <Box pos="absolute" inset={0} style={{ transform }}>
        {showImage ? (
          <ReaderPageImage
            page={page}
            brightness={settings.brightness}
            alt={t('pageOfTotal', { page: page.index + 1, total: pagesLength })}
            onMeasure={(value) => onMeasure(key, value)}
          />
        ) : (
          <Skeleton h="100%" radius={0} animate={false} />
        )}
      </Box>
    </Box>
  );
}

export default ReaderPageSlot;
