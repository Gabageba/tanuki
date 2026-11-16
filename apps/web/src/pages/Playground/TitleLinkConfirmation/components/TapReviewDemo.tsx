import { useState } from 'react';
import { Box, Button, Stack, Text } from '@mantine/core';
import { ArrowLeftIcon, CheckIcon, CheckSquareIcon } from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import {
  BATCH_REVIEW_PRESENTATION,
  TAP_REVIEW_MODE,
  type BatchReviewPresentation,
  type TapReviewMode,
} from '../models';
import BatchReviewFooter from './BatchReviewFooter';
import ReviewSelectionContent from './ReviewSelectionContent';
import useComparison from '../hooks/useComparison';
import useMatchSelection from '../hooks/useMatchSelection';
import QuickBatchActions from './QuickBatchActions';
import MatchesRail from './MatchesRail';
import QuickMatchesHeader from './QuickMatchesHeader';
import TapReviewCandidate from './TapReviewCandidate';
import HeaderReviewActions from './HeaderReviewActions';

type Props = {
  mode: TapReviewMode;
  isPhone: boolean;
  isStaff?: boolean;
  isEmpty?: boolean;
  refinedBatchActions?: boolean;
  batchPresentation?: BatchReviewPresentation;
  hideUnselectedBatchActions?: boolean;
};

function TapReviewDemo({
  mode,
  isPhone,
  isStaff = true,
  isEmpty = false,
  refinedBatchActions = false,
  batchPresentation = BATCH_REVIEW_PRESENTATION.ORIGINAL,
  hideUnselectedBatchActions = false,
}: Props) {
  const review = useComparison(1, false);
  const [checking, setChecking] = useState(false);
  const isPending = review.pendingVerdict !== null;
  const selection = useMatchSelection(isPending);
  const selectedIndex =
    review.opened && review.verdict !== TITLE_LINK_VERDICT.REJECTED ? review.selectedIndex : null;
  const toggleChecking = () => {
    setChecking((current) => !current);
    review.close();
    selection.clearSelection();
  };
  const getExitLabel = () => {
    switch (batchPresentation) {
      case BATCH_REVIEW_PRESENTATION.ORIGINAL:
        return 'Завершить проверку';
      case BATCH_REVIEW_PRESENTATION.DIVIDER:
      case BATCH_REVIEW_PRESENTATION.FRAME:
        return 'К просмотру';
      case BATCH_REVIEW_PRESENTATION.PANEL:
        return 'Закрыть выбор';
    }
  };
  const getExitIcon = () => {
    switch (batchPresentation) {
      case BATCH_REVIEW_PRESENTATION.ORIGINAL:
        return <CheckIcon />;
      case BATCH_REVIEW_PRESENTATION.DIVIDER:
      case BATCH_REVIEW_PRESENTATION.PANEL:
      case BATCH_REVIEW_PRESENTATION.FRAME:
        return <ArrowLeftIcon />;
    }
  };
  const modeButton = (
    <Button
      size="xs"
      variant={
        checking && batchPresentation === BATCH_REVIEW_PRESENTATION.ORIGINAL ? 'light' : 'default'
      }
      w={isPhone ? '100%' : 'auto'}
      leftSection={checking ? getExitIcon() : <CheckSquareIcon />}
      disabled={isPending}
      onClick={toggleChecking}
    >
      {checking ? getExitLabel() : 'Проверить связи'}
    </Button>
  );
  const getHeaderModeButton = () => {
    switch (batchPresentation) {
      case BATCH_REVIEW_PRESENTATION.ORIGINAL:
      case BATCH_REVIEW_PRESENTATION.DIVIDER:
      case BATCH_REVIEW_PRESENTATION.PANEL:
        return modeButton;
      case BATCH_REVIEW_PRESENTATION.FRAME:
        return checking ? null : modeButton;
    }
  };
  const getHeader = () => {
    switch (mode) {
      case TAP_REVIEW_MODE.BATCH:
        return null;
      case TAP_REVIEW_MODE.MENU:
        return (
          <Text fz="sm" c="dimmed">
            Нажмите на карточку, чтобы открыть действия со связью
          </Text>
        );
      case TAP_REVIEW_MODE.HEADER:
        return <HeaderReviewActions review={review} isEmpty={isEmpty} />;
    }
  };

  const getFooter = () => {
    switch (mode) {
      case TAP_REVIEW_MODE.MENU:
      case TAP_REVIEW_MODE.HEADER:
        return null;
      case TAP_REVIEW_MODE.BATCH:
        return (
          <BatchReviewFooter
            presentation={batchPresentation}
            isEmpty={isEmpty}
            selectedCount={selection.selectedIndexes.length}
            hideWhenUnselected={hideUnselectedBatchActions}
          >
            <QuickBatchActions
              review={review}
              selectedIndexes={selection.selectedIndexes}
              clearSelection={selection.clearSelection}
              isPhone={isPhone}
              confirmLabel="Подтвердить связи"
              rejectLabel="Отклонить связи"
              withClearSelection
              colored={refinedBatchActions}
              split={refinedBatchActions}
              stackOnPhone={batchPresentation !== BATCH_REVIEW_PRESENTATION.ORIGINAL}
              isEmpty={isEmpty}
            />
          </BatchReviewFooter>
        );
    }
  };

  return (
    <Box
      data-tap-review={mode}
      data-phone={isPhone || undefined}
      data-batch-presentation={batchPresentation}
      pos="relative"
      bg="var(--mantine-color-body)"
    >
      <Stack gap={8} p="md">
        <QuickMatchesHeader
          review={review}
          isPhone={isPhone}
          isStaff={isStaff}
          modeButton={getHeaderModeButton()}
        >
          {checking && isStaff && getHeader()}
        </QuickMatchesHeader>
        <ReviewSelectionContent
          presentation={batchPresentation}
          checking={checking && isStaff}
          exitAction={modeButton}
          footer={checking && isStaff ? getFooter() : null}
        >
          <MatchesRail
            review={review}
            isCurrent={false}
            isStaff={isStaff}
            isEmpty={isEmpty}
            actions={() => null}
            card={(index) => (
              <TapReviewCandidate
                index={index}
                mode={mode}
                checking={checking && isStaff}
                review={review}
                selectedIndex={selectedIndex}
                onSelect={review.select}
                selection={selection}
              />
            )}
          />
        </ReviewSelectionContent>
      </Stack>
    </Box>
  );
}

export default TapReviewDemo;
