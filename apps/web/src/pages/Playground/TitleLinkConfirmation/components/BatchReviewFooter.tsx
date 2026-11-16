import type { ReactNode } from 'react';
import { Divider, Paper, Stack } from '@mantine/core';
import { BATCH_REVIEW_PRESENTATION, type BatchReviewPresentation } from '../models';

type Props = {
  presentation: BatchReviewPresentation;
  children: ReactNode;
  isEmpty: boolean;
  selectedCount: number;
  hideWhenUnselected?: boolean;
};

function BatchReviewFooter({
  presentation,
  children,
  isEmpty,
  selectedCount,
  hideWhenUnselected = false,
}: Props) {
  if (isEmpty || (hideWhenUnselected && selectedCount === 0)) return null;

  switch (presentation) {
    case BATCH_REVIEW_PRESENTATION.ORIGINAL:
      return children;
    case BATCH_REVIEW_PRESENTATION.DIVIDER:
    case BATCH_REVIEW_PRESENTATION.FRAME:
      return (
        <Stack gap="md" mt="sm">
          <Divider />
          {children}
        </Stack>
      );
    case BATCH_REVIEW_PRESENTATION.PANEL:
      return (
        <Paper withBorder radius="md" p="md" mt="sm" bg="var(--mantine-color-default)">
          {children}
        </Paper>
      );
  }
}

export default BatchReviewFooter;
