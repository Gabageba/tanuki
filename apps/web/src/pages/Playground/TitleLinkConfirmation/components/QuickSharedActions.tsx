import { Group, Stack, Text } from '@mantine/core';
import { MATCHES } from '../mocks';
import { getVerdictLabel } from '../lib';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import type useComparison from '../hooks/useComparison';
import QuickDecisionButtons from './QuickDecisionButtons';

type Props = { review: ReturnType<typeof useComparison> };

function QuickSharedActions({ review }: Props) {
  if (!review.opened) {
    return (
      <Text fz="sm" c="dimmed">
        Выберите кандидата, чтобы проверить связь
      </Text>
    );
  }

  return (
    <Group justify="space-between" gap="xs" data-shared-actions>
      <Stack gap={4} miw={0} flex={1}>
        <Text fz="sm" lineClamp={1} title={MATCHES[review.selectedIndex]!.title.name}>
          {MATCHES[review.selectedIndex]!.title.name}
        </Text>
        {review.verdict !== TITLE_LINK_VERDICT.NONE && (
          <Text fz="xs" c="dimmed" aria-live="polite">
            {getVerdictLabel(review.verdict)}
          </Text>
        )}
      </Stack>
      <QuickDecisionButtons review={review} index={review.selectedIndex} />
    </Group>
  );
}

export default QuickSharedActions;
