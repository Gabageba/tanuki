import { Box } from '@mantine/core';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';
import QuickDecisionButtons from './QuickDecisionButtons';
import styles from './QuickCoverCard.module.scss';

type Props = {
  index: number;
  review: ReturnType<typeof useComparison>;
  isStaff: boolean;
};

function QuickCoverCard({ index, review, isStaff }: Props) {
  return (
    <Box pos="relative">
      <SourceTitleCard title={MATCHES[index]!.title} showSource />
      {isStaff && (
        <Box
          className={styles.coverActions}
          pos="absolute"
          top={0}
          w="100%"
          style={{ aspectRatio: '3 / 4' }}
        >
          <Box
            className={styles.controls}
            pos="absolute"
            bottom="var(--mantine-spacing-xl)"
            w="100%"
          >
            <QuickDecisionButtons review={review} index={index} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default QuickCoverCard;
