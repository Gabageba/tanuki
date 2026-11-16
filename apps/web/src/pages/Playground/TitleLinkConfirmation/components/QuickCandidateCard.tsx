import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import {
  QUICK_CONFIRMATION_MODE,
  type QuickConfirmationMode,
  type ReviewActionLayout,
} from '../models';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';
import QuickCoverCard from './QuickCoverCard';
import ReviewCandidateCard from './ReviewCandidateCard';

type Props = {
  mode: QuickConfirmationMode;
  index: number;
  review: ReturnType<typeof useComparison>;
  isStaff: boolean;
  checking: boolean;
  actionLayout: ReviewActionLayout;
};

function QuickCandidateCard({ mode, index, review, isStaff, checking, actionLayout }: Props) {
  switch (mode) {
    case QUICK_CONFIRMATION_MODE.DIRECT:
    case QUICK_CONFIRMATION_MODE.MENU:
    case QUICK_CONFIRMATION_MODE.LIST:
    case QUICK_CONFIRMATION_MODE.PANEL:
    case QUICK_CONFIRMATION_MODE.EXPAND:
    case QUICK_CONFIRMATION_MODE.BATCH:
      return <SourceTitleCard title={MATCHES[index]!.title} showSource />;
    case QUICK_CONFIRMATION_MODE.REVIEW:
      return (
        <ReviewCandidateCard
          layout={actionLayout}
          checking={checking && isStaff}
          index={index}
          review={review}
        />
      );
    case QUICK_CONFIRMATION_MODE.COVER:
      return <QuickCoverCard index={index} review={review} isStaff={isStaff} />;
  }
}

export default QuickCandidateCard;
