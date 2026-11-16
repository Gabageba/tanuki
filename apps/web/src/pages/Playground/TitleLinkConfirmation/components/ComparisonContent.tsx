import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  ArrowCounterClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { MATCHES, ORIGINAL_TITLE } from '../mocks';
import { getConfidenceLabel, getEffectiveConfidence, getVerdictLabel } from '../lib';
import type useComparison from '../hooks/useComparison';
import ComparisonTitle from './ComparisonTitle';
import ComparisonDetails from './ComparisonDetails';

type Props = {
  review: ReturnType<typeof useComparison>;
  isPhone: boolean;
  forcePending?: boolean;
};

function ComparisonContent({ review, isPhone, forcePending = false }: Props) {
  const { selectedIndex, select, save, verdict, pendingVerdict } = review;
  const match = MATCHES[selectedIndex]!;
  const isPending = pendingVerdict !== null || forcePending;

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text fz="xs" c="dimmed">
          {getConfidenceLabel(getEffectiveConfidence(match.confidence, verdict))}
        </Text>
        <Text fz="xs" ff="monospace" c="dimmed" flex="none">
          {selectedIndex + 1} / {MATCHES.length}
        </Text>
      </Group>
      <SimpleGrid cols={2} spacing={isPhone ? 'sm' : 'xl'}>
        <ComparisonTitle title={ORIGINAL_TITLE} caption="Исходный тайтл" />
        <ComparisonTitle title={match.title} caption="Кандидат" />
      </SimpleGrid>
      <ComparisonDetails key={match.title.id} original={ORIGINAL_TITLE} candidate={match.title} />
      <Stack gap={8} py="xs">
        <Text
          fz="sm"
          c={verdict === TITLE_LINK_VERDICT.CONFIRMED ? 'teal' : 'dimmed'}
          aria-live="polite"
        >
          {isPending ? 'Сохраняем решение…' : getVerdictLabel(verdict)}
        </Text>
        <SimpleGrid cols={2} spacing="xs">
          <Button
            leftSection={<ThumbsUpIcon />}
            loading={pendingVerdict === TITLE_LINK_VERDICT.CONFIRMED || forcePending}
            disabled={isPending || verdict === TITLE_LINK_VERDICT.CONFIRMED}
            onClick={() => save(TITLE_LINK_VERDICT.CONFIRMED)}
          >
            Это он
          </Button>
          <Button
            variant="default"
            leftSection={<ThumbsDownIcon />}
            loading={pendingVerdict === TITLE_LINK_VERDICT.REJECTED}
            disabled={isPending || verdict === TITLE_LINK_VERDICT.REJECTED}
            onClick={() => save(TITLE_LINK_VERDICT.REJECTED)}
          >
            Не он
          </Button>
        </SimpleGrid>
        <SimpleGrid cols={2} spacing="xs">
          <Button
            variant="subtle"
            leftSection={<ArrowLeftIcon />}
            disabled={isPending || selectedIndex === 0}
            onClick={() => select(selectedIndex - 1)}
          >
            Предыдущий
          </Button>
          <Button
            variant="subtle"
            leftSection={<ArrowRightIcon />}
            disabled={isPending || selectedIndex === MATCHES.length - 1}
            onClick={() => select(selectedIndex + 1)}
          >
            Следующий
          </Button>
        </SimpleGrid>
        {verdict !== TITLE_LINK_VERDICT.NONE && (
          <Button
            variant="subtle"
            color="gray"
            leftSection={<ArrowCounterClockwiseIcon />}
            loading={pendingVerdict === TITLE_LINK_VERDICT.NONE}
            disabled={isPending}
            onClick={() => save(TITLE_LINK_VERDICT.NONE)}
          >
            Снять пометку связи
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

export default ComparisonContent;
