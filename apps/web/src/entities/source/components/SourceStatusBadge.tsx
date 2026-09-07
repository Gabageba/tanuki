import { useState } from 'react';
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { SOURCE_STATUS, type SourceStatus } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';
import { getSourceStatusColor, getSourceStatusLabel } from '@/entities/source/lib';

type Props = {
  sourceId: string;
  status: SourceStatus;
};

function SourceStatusBadge({ sourceId, status }: Props) {
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();
  const color = getSourceStatusColor(status);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await apiFetch(`/sources/${sourceId}/health`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: ['sources'] });
      await queryClient.invalidateQueries({ queryKey: ['source', sourceId] });
      notifications.show({ color: 'green', title: 'Нестабильность сброшена', message: sourceId });
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Не удалось сбросить нестабильность';
      notifications.show({ color: 'red', title: 'Ошибка', message });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Group gap={6} align="center">
      <Box bg={color} bdrs="50%" w={6} h={6} mt={3} />
      <Text c={color} fz={12} lh={1}>
        {getSourceStatusLabel(status)}
      </Text>
      {import.meta.env.DEV && status === SOURCE_STATUS.DEGRADED && (
        <Tooltip label="Сбросить нестабильность источника (дев)">
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            loading={isResetting}
            onClick={handleReset}
          >
            <ArrowClockwiseIcon size={12} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

export default SourceStatusBadge;
