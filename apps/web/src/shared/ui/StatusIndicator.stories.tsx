import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '@mantine/core';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import StatusIndicator from './StatusIndicator';

const META = {
  title: 'UI/StatusIndicator',
  render: () => (
    <Stack p="md" gap="xs">
      <StatusIndicator color={STATUS_OK_COLOR} label="Онлайн" coloredText />
      <StatusIndicator color={STATUS_DEGRADED_COLOR} label="Нестабилен" coloredText />
      <StatusIndicator color={STATUS_DOWN_COLOR} label="Недоступен" coloredText />
      <StatusIndicator color={STATUS_OK_COLOR} label="27 источников" fz={12} />
    </Stack>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Статусы' };
