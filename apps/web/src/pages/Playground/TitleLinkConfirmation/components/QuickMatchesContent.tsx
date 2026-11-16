import {
  QUICK_CONFIRMATION_MODE,
  REVIEW_ACTION_LAYOUT,
  type QuickConfirmationMode,
  type ReviewActionLayout,
} from '../models';
import type useComparison from '../hooks/useComparison';
import MatchesRail from './MatchesRail';
import QuickMatchActions from './QuickMatchActions';
import QuickMatchesList from './QuickMatchesList';
import QuickCandidateCard from './QuickCandidateCard';

type Props = {
  mode: QuickConfirmationMode;
  checking: boolean;
  actionLayout: ReviewActionLayout;
  review: ReturnType<typeof useComparison>;
  isStaff: boolean;
  isEmpty: boolean;
  selectedIndexes: number[];
  onToggleSelection: (index: number) => void;
};

function QuickMatchesContent({
  mode,
  checking,
  actionLayout,
  review,
  isStaff,
  isEmpty,
  selectedIndexes,
  onToggleSelection,
}: Props) {
  switch (mode) {
    case QUICK_CONFIRMATION_MODE.DIRECT:
    case QUICK_CONFIRMATION_MODE.MENU:
    case QUICK_CONFIRMATION_MODE.REVIEW:
    case QUICK_CONFIRMATION_MODE.PANEL:
    case QUICK_CONFIRMATION_MODE.COVER:
    case QUICK_CONFIRMATION_MODE.EXPAND:
    case QUICK_CONFIRMATION_MODE.BATCH:
      return (
        <MatchesRail
          review={review}
          isStaff={isStaff}
          isEmpty={isEmpty}
          isCurrent={false}
          cardWidth={
            mode === QUICK_CONFIRMATION_MODE.REVIEW &&
            checking &&
            isStaff &&
            actionLayout === REVIEW_ACTION_LAYOUT.SIDE
              ? 214
              : 170
          }
          card={(index) => (
            <QuickCandidateCard
              mode={mode}
              index={index}
              review={review}
              isStaff={isStaff}
              checking={checking}
              actionLayout={actionLayout}
            />
          )}
          actions={(index) =>
            isStaff ? (
              <QuickMatchActions
                mode={mode}
                checking={checking}
                actionLayout={actionLayout}
                review={review}
                index={index}
                selectedIndexes={selectedIndexes}
                onToggleSelection={onToggleSelection}
              />
            ) : null
          }
        />
      );
    case QUICK_CONFIRMATION_MODE.LIST:
      return <QuickMatchesList review={review} isStaff={isStaff} isEmpty={isEmpty} />;
  }
}

export default QuickMatchesContent;
