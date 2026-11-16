import { QUICK_CONFIRMATION_MODE, type QuickConfirmationMode } from '../models';
import type useComparison from '../hooks/useComparison';
import QuickSharedActions from './QuickSharedActions';
import QuickBatchActions from './QuickBatchActions';

type Props = {
  mode: QuickConfirmationMode;
  review: ReturnType<typeof useComparison>;
  selectedIndexes: number[];
  clearSelection: () => void;
  isPhone: boolean;
  isStaff: boolean;
  isEmpty: boolean;
};

function QuickBlockActions({
  mode,
  review,
  selectedIndexes,
  clearSelection,
  isPhone,
  isStaff,
  isEmpty,
}: Props) {
  if (!isStaff || isEmpty) return null;

  switch (mode) {
    case QUICK_CONFIRMATION_MODE.DIRECT:
    case QUICK_CONFIRMATION_MODE.MENU:
    case QUICK_CONFIRMATION_MODE.REVIEW:
    case QUICK_CONFIRMATION_MODE.LIST:
    case QUICK_CONFIRMATION_MODE.COVER:
    case QUICK_CONFIRMATION_MODE.EXPAND:
      return null;
    case QUICK_CONFIRMATION_MODE.PANEL:
      return <QuickSharedActions review={review} />;
    case QUICK_CONFIRMATION_MODE.BATCH:
      return (
        <QuickBatchActions
          review={review}
          selectedIndexes={selectedIndexes}
          clearSelection={clearSelection}
          isPhone={isPhone}
        />
      );
  }
}

export default QuickBlockActions;
