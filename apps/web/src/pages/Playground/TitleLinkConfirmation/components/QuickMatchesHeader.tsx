import { useState, type ReactNode } from 'react';
import { Button, Group, Stack, Title } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';
import type useComparison from '../hooks/useComparison';
import ManualLinkModal from './ManualLinkModal';

type Props = {
  review: ReturnType<typeof useComparison>;
  isPhone: boolean;
  isStaff: boolean;
  modeButton: ReactNode;
  children?: ReactNode;
};

function QuickMatchesHeader({ review, isPhone, isStaff, modeButton, children }: Props) {
  const [manualOpened, setManualOpened] = useState(false);

  return (
    <Stack gap={8} data-match-review-header>
      <Group gap={8} justify="space-between">
        <Title order={5}>Найдено на других источниках</Title>
        {isStaff && (
          <Group gap={8} w={isPhone ? '100%' : 'auto'}>
            {modeButton}
            <Button
              size="xs"
              variant="default"
              w={isPhone ? '100%' : 'auto'}
              leftSection={<PlusIcon />}
              disabled={review.pendingVerdict !== null}
              onClick={() => setManualOpened(true)}
            >
              Добавить вручную
            </Button>
          </Group>
        )}
      </Group>
      {children}
      <ManualLinkModal
        opened={manualOpened}
        onClose={() => setManualOpened(false)}
        onAdd={review.confirmManual}
      />
    </Stack>
  );
}

export default QuickMatchesHeader;
