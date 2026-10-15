import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, Badge, Box } from '@mantine/core';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import EntityHeading from './EntityHeading';

const META = {
  title: 'UI/EntityHeading',
  render: () => (
    <Box p="md" w={360}>
      <EntityHeading
        icon={<Avatar name="night_reader" color={PRIMARY_COLOR} variant="outline" size={40} />}
        title="night_reader"
        badge={
          <Badge size="xs" variant="muted" color="gray" flex="none">
            Вы
          </Badge>
        }
        subtitle="reader@example.com"
      />
    </Box>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Аватар, имя, бейдж, почта' };
