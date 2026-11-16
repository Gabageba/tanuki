import { CloseButton, Drawer, Group, Paper, Stack, Text } from '@mantine/core';
import { GitDiffIcon } from '@phosphor-icons/react';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import { COMPARISON_LAYOUT, CONTAINED_OVERLAY_STYLES, type ComparisonLayout } from '../models';
import type useComparison from '../hooks/useComparison';
import ComparisonContent from './ComparisonContent';

type Props = {
  layout: ComparisonLayout;
  isPhone: boolean;
  review: ReturnType<typeof useComparison>;
};

function ComparisonSurface({ layout, isPhone, review }: Props) {
  const content = <ComparisonContent review={review} isPhone={isPhone} />;

  switch (layout) {
    case COMPARISON_LAYOUT.CURRENT:
      return null;
    case COMPARISON_LAYOUT.INLINE:
      if (!review.opened) return null;
      return (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between" wrap="nowrap">
              <Text fw={600}>Сравнение тайтлов</Text>
              <CloseButton aria-label="Закрыть сравнение" onClick={review.close} />
            </Group>
            {content}
          </Stack>
        </Paper>
      );
    case COMPARISON_LAYOUT.MODAL:
      return (
        <ToneModal
          opened={review.opened}
          onClose={review.close}
          title="Сравнение тайтлов"
          tone={MODAL_TONE.NEUTRAL}
          icon={GitDiffIcon}
          size={600}
          withinPortal={false}
          lockScroll={false}
          trapFocus={false}
          returnFocus={false}
          closeButtonProps={{ 'aria-label': 'Закрыть сравнение' }}
          styles={{
            ...CONTAINED_OVERLAY_STYLES,
            inner: { position: 'absolute', padding: isPhone ? 0 : 24 },
            content: {
              maxHeight: '100%',
              height: isPhone ? '100%' : undefined,
              borderRadius: isPhone ? 0 : undefined,
            },
          }}
        >
          {content}
        </ToneModal>
      );
    case COMPARISON_LAYOUT.DRAWER:
      return (
        <Drawer
          opened={review.opened}
          onClose={review.close}
          title="Сравнение тайтлов"
          position={isPhone ? 'bottom' : 'right'}
          size={isPhone ? '88%' : 480}
          withinPortal={false}
          lockScroll={false}
          trapFocus={false}
          returnFocus={false}
          closeButtonProps={{ 'aria-label': 'Закрыть сравнение' }}
          styles={CONTAINED_OVERLAY_STYLES}
        >
          {content}
        </Drawer>
      );
  }
}

export default ComparisonSurface;
