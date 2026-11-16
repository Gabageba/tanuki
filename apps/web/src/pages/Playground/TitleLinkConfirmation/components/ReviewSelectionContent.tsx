import type { ReactNode } from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { BATCH_REVIEW_PRESENTATION, type BatchReviewPresentation } from '../models';

type Props = {
  presentation: BatchReviewPresentation;
  checking: boolean;
  children: ReactNode;
  footer: ReactNode;
  exitAction: ReactNode;
};

function ReviewSelectionContent({ presentation, checking, children, footer, exitAction }: Props) {
  const content = (
    <Stack gap={8}>
      {children}
      {footer}
    </Stack>
  );
  if (!checking) return content;

  switch (presentation) {
    case BATCH_REVIEW_PRESENTATION.ORIGINAL:
    case BATCH_REVIEW_PRESENTATION.DIVIDER:
    case BATCH_REVIEW_PRESENTATION.PANEL:
      return content;
    case BATCH_REVIEW_PRESENTATION.FRAME:
      return (
        <Paper withBorder radius="md" p="md" bg="var(--mantine-color-body)" data-selection-frame>
          <Stack gap="md">
            <Group justify="space-between" gap={8}>
              <Text fz="sm" fw={500}>
                Выбор связей
              </Text>
              {exitAction}
            </Group>
            {content}
          </Stack>
        </Paper>
      );
  }
}

export default ReviewSelectionContent;
