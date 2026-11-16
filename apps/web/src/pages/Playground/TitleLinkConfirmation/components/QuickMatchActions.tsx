import { Checkbox } from '@mantine/core';
import { MATCHES } from '../mocks';
import {
  QUICK_CONFIRMATION_MODE,
  type QuickConfirmationMode,
  type ReviewActionLayout,
} from '../models';
import type useComparison from '../hooks/useComparison';
import QuickDecisionButtons from './QuickDecisionButtons';
import ReviewDecisionButtons from './ReviewDecisionButtons';
import QuickVerdictMenu from './QuickVerdictMenu';
import QuickSelectCandidate from './QuickSelectCandidate';
import QuickExpandableActions from './QuickExpandableActions';

type Props = {
  mode: QuickConfirmationMode;
  checking: boolean;
  actionLayout: ReviewActionLayout;
  review: ReturnType<typeof useComparison>;
  index: number;
  selectedIndexes: number[];
  onToggleSelection: (index: number) => void;
};

function QuickMatchActions({
  mode,
  checking,
  actionLayout,
  review,
  index,
  selectedIndexes,
  onToggleSelection,
}: Props) {
  switch (mode) {
    case QUICK_CONFIRMATION_MODE.DIRECT:
    case QUICK_CONFIRMATION_MODE.LIST:
      return <QuickDecisionButtons review={review} index={index} />;
    case QUICK_CONFIRMATION_MODE.MENU:
      return <QuickVerdictMenu review={review} index={index} />;
    case QUICK_CONFIRMATION_MODE.REVIEW:
      if (!checking) return null;
      return <ReviewDecisionButtons review={review} index={index} layout={actionLayout} />;
    case QUICK_CONFIRMATION_MODE.PANEL:
      return <QuickSelectCandidate review={review} index={index} />;
    case QUICK_CONFIRMATION_MODE.COVER:
      return null;
    case QUICK_CONFIRMATION_MODE.EXPAND:
      return <QuickExpandableActions review={review} index={index} />;
    case QUICK_CONFIRMATION_MODE.BATCH:
      return (
        <Checkbox
          label="Выбрать"
          aria-label={`Выбрать кандидата «${MATCHES[index]!.title.name}»`}
          checked={selectedIndexes.includes(index)}
          disabled={review.pendingVerdict !== null}
          onChange={() => onToggleSelection(index)}
          styles={{ labelWrapper: { flex: 1 } }}
        />
      );
  }
}

export default QuickMatchActions;
