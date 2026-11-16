import { Button, Group, Stack, Text } from '@mantine/core';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import { MATCHES } from '../mocks';
import { REVIEW_ACTION_LAYOUT } from '../models';
import { getVerdictLabel } from '../lib';
import type useComparison from '../hooks/useComparison';
import ReviewDecisionButtons from './ReviewDecisionButtons';

type Props = { review: ReturnType<typeof useComparison>; isEmpty: boolean };

function HeaderReviewActions({ review, isEmpty }: Props) {
  if (isEmpty) return null;
  if (!review.opened || review.verdict === TITLE_LINK_VERDICT.REJECTED) {
    return (
      <Text fz="sm" c="dimmed">
        Нажмите на карточку, чтобы выбрать связь для проверки
      </Text>
    );
  }

  const match = MATCHES[review.selectedIndex]!;
  return (
    <Group gap={8} justify="space-between" data-header-review-actions>
      <Stack gap={4} flex="1 1 200px" miw={0} aria-live="polite">
        <Text fz="sm" fw={500} lineClamp={1} title={match.title.name}>
          {match.title.name}
        </Text>
        <Text fz="xs" c="dimmed">
          {getVerdictLabel(review.verdict)}
        </Text>
      </Stack>
      <Group gap={8}>
        <ReviewDecisionButtons
          review={review}
          index={review.selectedIndex}
          layout={REVIEW_ACTION_LAYOUT.SEPARATE}
        />
        <Button
          component={Link}
          to={getTitleCardPath(match.title.id)}
          size="xs"
          variant="default"
          leftSection={<ArrowSquareOutIcon />}
          disabled={review.pendingVerdict !== null}
        >
          Открыть тайтл
        </Button>
      </Group>
    </Group>
  );
}

export default HeaderReviewActions;
