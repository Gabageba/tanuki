import { Badge } from '@mantine/core';
import type { Source } from '@tanuki/contracts';

const STATUS_PRESET: Record<Source['status'], { color: string; label: string }> = {
  ok: { color: 'green', label: 'подключён' },
  degraded: { color: 'yellow', label: 'нестабилен' },
  down: { color: 'red', label: 'недоступен' },
};

interface SourceStatusBadgeProps {
  status: Source['status'];
}

export default function SourceStatusBadge({ status }: SourceStatusBadgeProps) {
  const preset = STATUS_PRESET[status];
  return (
    <Badge color={preset.color} variant="light" size="sm">
      {preset.label}
    </Badge>
  );
}
