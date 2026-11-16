import { useState } from 'react';
import { Box, Button, Stack } from '@mantine/core';
import { CheckIcon, CheckSquareIcon } from '@phosphor-icons/react';
import {
  QUICK_CONFIRMATION_MODE,
  REVIEW_ACTION_LAYOUT,
  type QuickConfirmationMode,
  type ReviewActionLayout,
} from '../models';
import useComparison from '../hooks/useComparison';
import useMatchSelection from '../hooks/useMatchSelection';
import QuickMatchesContent from './QuickMatchesContent';
import QuickMatchesHeader from './QuickMatchesHeader';
import QuickBlockActions from './QuickBlockActions';

type Props = {
  mode: QuickConfirmationMode;
  isPhone: boolean;
  isStaff?: boolean;
  isEmpty?: boolean;
  actionLayout?: ReviewActionLayout;
};

function QuickMatchesDemo({
  mode,
  isPhone,
  isStaff = true,
  isEmpty = false,
  actionLayout = REVIEW_ACTION_LAYOUT.ORIGINAL,
}: Props) {
  const review = useComparison(1, false);
  const [checking, setChecking] = useState(false);
  const { selectedIndexes, toggleSelection, clearSelection } = useMatchSelection(
    review.pendingVerdict !== null,
  );
  const modeButton = (
    <Button
      size="xs"
      variant={checking ? 'light' : 'default'}
      w={isPhone ? '100%' : 'auto'}
      leftSection={checking ? <CheckIcon /> : <CheckSquareIcon />}
      disabled={review.pendingVerdict !== null}
      onClick={() => setChecking((value) => !value)}
    >
      {checking ? 'Завершить проверку' : 'Проверить связи'}
    </Button>
  );
  const getModeButton = () => {
    switch (mode) {
      case QUICK_CONFIRMATION_MODE.DIRECT:
      case QUICK_CONFIRMATION_MODE.MENU:
      case QUICK_CONFIRMATION_MODE.LIST:
      case QUICK_CONFIRMATION_MODE.PANEL:
      case QUICK_CONFIRMATION_MODE.COVER:
      case QUICK_CONFIRMATION_MODE.EXPAND:
      case QUICK_CONFIRMATION_MODE.BATCH:
        return null;
      case QUICK_CONFIRMATION_MODE.REVIEW:
        return modeButton;
    }
  };

  return (
    <Box
      data-quick-demo={mode}
      data-phone={isPhone || undefined}
      data-action-layout={actionLayout}
      pos="relative"
      bg="var(--mantine-color-body)"
    >
      <Stack gap={8} p="md">
        <QuickMatchesHeader
          review={review}
          isPhone={isPhone}
          isStaff={isStaff}
          modeButton={getModeButton()}
        />
        <QuickMatchesContent
          mode={mode}
          checking={checking}
          actionLayout={actionLayout}
          review={review}
          isStaff={isStaff}
          isEmpty={isEmpty}
          selectedIndexes={selectedIndexes}
          onToggleSelection={toggleSelection}
        />
        <QuickBlockActions
          mode={mode}
          review={review}
          selectedIndexes={selectedIndexes}
          clearSelection={clearSelection}
          isPhone={isPhone}
          isStaff={isStaff}
          isEmpty={isEmpty}
        />
      </Stack>
    </Box>
  );
}

export default QuickMatchesDemo;
