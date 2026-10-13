import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import type { ReactNode } from 'react';
import CoverImage from '@/shared/ui/CoverImage';
import useIsAdultTitleHidden from './hooks/useIsAdultTitleHidden';
import HiddenCoverOverlay from './HiddenCoverOverlay';
import BlurredCover from './BlurredCover';
import { HIDDEN_COVER_BLUR, type TitleCoverData } from './models';
import styles from './Title.module.scss';

type Props = {
  cover: TitleCoverData;
  /** Размер перечёркнутого глаза поверх скрытой 18+ — под размер обложки. */
  hiddenIconSize?: number;
  /** Маркеры поверх обложки — лента источника, бейджи, папка. */
  children?: ReactNode;
} & Omit<BoxProps, 'pos' | 'className'>;

/** Обложка тайтла 3:4: скрытый 18+ размыт и помечен глазом, как в каталоге. */
function TitleCover({ cover, hiddenIconSize, children, ...restProps }: Props) {
  const isHidden = useIsAdultTitleHidden(cover);

  return (
    <Box pos="relative" className={styles.imageWrapper} {...restProps}>
      <BlurredCover blur={isHidden ? HIDDEN_COVER_BLUR : 0}>
        <CoverImage src={cover.coverUrl} alt={cover.name} className={styles.image} />
      </BlurredCover>
      {isHidden && <HiddenCoverOverlay size={hiddenIconSize} />}
      {children}
    </Box>
  );
}

export default TitleCover;
