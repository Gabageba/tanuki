import { useState } from 'react';
import { Box, Button, Group, ScrollArea, Stack, Title } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';
import { COMPARISON_LAYOUT, type ComparisonLayout } from '../models';
import useComparison from '../hooks/useComparison';
import MatchesRail from './MatchesRail';
import ComparisonSurface from './ComparisonSurface';
import ManualLinkModal from './ManualLinkModal';

type Props = {
  layout: ComparisonLayout;
  isPhone: boolean;
  isStaff?: boolean;
  isEmpty?: boolean;
};

function MatchesDemo({ layout, isPhone, isStaff = true, isEmpty = false }: Props) {
  const review = useComparison(1, layout === COMPARISON_LAYOUT.INLINE);
  const [manualOpened, setManualOpened] = useState(false);
  const comparison =
    isStaff && !isEmpty ? (
      <ComparisonSurface layout={layout} review={review} isPhone={isPhone} />
    ) : null;
  const getComparisonSlots = () => {
    switch (layout) {
      case COMPARISON_LAYOUT.INLINE:
        return { inline: comparison, overlay: null };
      case COMPARISON_LAYOUT.CURRENT:
      case COMPARISON_LAYOUT.MODAL:
      case COMPARISON_LAYOUT.DRAWER:
        return { inline: null, overlay: comparison };
    }
  };
  const { inline, overlay } = getComparisonSlots();

  return (
    <Box
      data-comparison-demo={layout}
      data-phone={isPhone || undefined}
      pos="relative"
      h={isPhone ? 780 : 760}
      bg="var(--mantine-color-body)"
      style={{ overflow: 'hidden', isolation: 'isolate' }}
    >
      <ScrollArea h="100%" type="auto" offsetScrollbars>
        <Stack gap="md" p="md">
          <Group gap={8} justify="space-between">
            <Title order={5}>Найдено на других источниках</Title>
            {isStaff && (
              <Button
                w={isPhone ? '100%' : 'auto'}
                size="xs"
                variant="default"
                leftSection={<PlusIcon />}
                loading={review.pendingVerdict !== null}
                onClick={() => setManualOpened(true)}
              >
                Добавить вручную
              </Button>
            )}
          </Group>
          <MatchesRail
            review={review}
            isCurrent={layout === COMPARISON_LAYOUT.CURRENT}
            isStaff={isStaff}
            isEmpty={isEmpty}
          />
          {inline}
        </Stack>
      </ScrollArea>
      {overlay}
      <ManualLinkModal
        opened={manualOpened}
        onClose={() => setManualOpened(false)}
        onAdd={review.confirmManual}
      />
    </Box>
  );
}

export default MatchesDemo;
