import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SORT_ORDER } from '@tanuki/contracts';
import { NUDEMOON_HOME_SECTIONS } from '@/shared/storybook/titles';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import CoverlessSectionPanel from './CoverlessSectionPanel';

const META = {
  title: 'Страницы/Подборки/CoverlessSectionPanel',
  component: CoverlessSectionPanel,
  args: {
    section: NUDEMOON_HOME_SECTIONS[1]!,
    variant: '2026-11',
    order: SORT_ORDER.LIKES,
    onVariantChange: fn(),
    onOrderChange: fn(),
  },
} satisfies Meta<typeof CoverlessSectionPanel>;
export default META;
type Story = StoryObj<typeof META>;
export const Default: Story = { name: 'Обычная' };
export const Mobile: Story = { name: 'На телефоне', globals: MOBILE_GLOBALS };
