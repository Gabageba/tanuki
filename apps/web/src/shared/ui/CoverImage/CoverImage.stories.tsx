import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleGrid } from '@mantine/core';
import { getCoverUrl } from '@/shared/storybook/images';
import CoverImage from '.';

const META = {
  title: 'UI/CoverImage',
  render: () => (
    <SimpleGrid cols={3} p="md" maw={600}>
      <CoverImage src={getCoverUrl('Берсерк')} alt="Берсерк" />
      <CoverImage src={null} alt="Без обложки" />
      <CoverImage src="/api/v1/broken-image.png" alt="Битая ссылка" />
    </SimpleGrid>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const States: Story = { name: 'Обложка, нет обложки, битая ссылка' };
