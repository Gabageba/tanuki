import { UnstyledButton } from '@mantine/core';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { MATCHES } from '../mocks';
import { TAP_REVIEW_MODE, type TapReviewMode } from '../models';
import type useComparison from '../hooks/useComparison';
import type useMatchSelection from '../hooks/useMatchSelection';
import BatchReviewCard from './BatchReviewCard';
import TapReviewCardMenu from './TapReviewCardMenu';
import TapReviewCard from './TapReviewCard';
import styles from './TapReviewCard.module.scss';

type Props = {
  index: number;
  mode: TapReviewMode;
  checking: boolean;
  review: ReturnType<typeof useComparison>;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  selection: ReturnType<typeof useMatchSelection>;
};

function TapReviewCandidate({
  index,
  mode,
  checking,
  review,
  selectedIndex,
  onSelect,
  selection,
}: Props) {
  if (!checking) return <SourceTitleCard title={MATCHES[index]!.title} showSource />;

  switch (mode) {
    case TAP_REVIEW_MODE.BATCH:
      return (
        <BatchReviewCard
          index={index}
          selected={selection.selectedIndexes.includes(index)}
          disabled={review.pendingVerdict !== null}
          onToggle={selection.toggleSelection}
        />
      );
    case TAP_REVIEW_MODE.MENU:
      return <TapReviewCardMenu index={index} review={review} />;
    case TAP_REVIEW_MODE.HEADER:
      return (
        <TapReviewCard index={index} selected={selectedIndex === index}>
          <UnstyledButton
            pos="absolute"
            inset={0}
            w="100%"
            h="100%"
            className={styles.trigger}
            aria-label={`Выбрать кандидата «${MATCHES[index]!.title.name}»`}
            aria-pressed={selectedIndex === index}
            disabled={review.pendingVerdict !== null}
            onClick={() => onSelect(index)}
          />
        </TapReviewCard>
      );
  }
}

export default TapReviewCandidate;
