import type { ReactNode } from 'react';
import { Box } from '@mantine/core';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { MATCHES } from '../mocks';
import styles from './TapReviewCard.module.scss';

type Props = { index: number; selected?: boolean; children: ReactNode };

function TapReviewCard({ index, selected = false, children }: Props) {
  return (
    <Box pos="relative" className={styles.card} data-selected={selected || undefined}>
      <SourceTitleCard title={MATCHES[index]!.title} showSource />
      {children}
    </Box>
  );
}

export default TapReviewCard;
