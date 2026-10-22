import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleGrid, Stack } from '@mantine/core';
import { SOURCE_ACCESS, SOURCE_STATUS, SOURCE_STATUS_REASON } from '@tanuki/contracts';
import { DOWN_SOURCE, SOURCES } from '@/shared/storybook/fixtures';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import SourceLoginBadge from '../SourceLoginBadge';
import SourceStatusBadge from '../SourceStatusBadge';
import SourceTitle from '../SourceTitle';
import SourceTitleSkeleton from '../SourceTitle/SourceTitleSkeleton';
import SourceCardSkeleton from './SourceCardSkeleton';
import SourceCard from '.';

const OK_SOURCE = SOURCES.find(({ id }) => id === 'readmanga_ru')!;
const LOCKED_SOURCE = SOURCES.find(({ access }) => access === SOURCE_ACCESS.LOCKED)!;
const DEGRADED_SOURCE = {
  ...OK_SOURCE,
  id: 'mintmanga',
  title: 'MintManga',
  status: SOURCE_STATUS.DEGRADED,
  statusReason: SOURCE_STATUS_REASON.REQUEST_FAILURES,
};
const ADULT_VPN_SOURCE = SOURCES.find(({ isAdult, requiresVpn }) => isAdult || requiresVpn)!;

const META = {
  title: 'Карточки/SourceCard',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Cards: Story = {
  name: 'Карточки источников',
  render: () => (
    <SimpleGrid cols={2} p="md" maw={760}>
      <SourceCard source={OK_SOURCE} />
      <SourceCard source={DEGRADED_SOURCE} />
      <SourceCard source={DOWN_SOURCE} />
      <SourceCard source={LOCKED_SOURCE} />
      <SourceCard source={ADULT_VPN_SOURCE} />
    </SimpleGrid>
  ),
};

export const Badges: Story = {
  name: 'Заголовок, статус и пометка о входе',
  render: () => (
    <Stack p="md" maw={420}>
      <SourceTitle source={OK_SOURCE} showStatus />
      <SourceTitle source={LOCKED_SOURCE} showStatus />
      <SourceStatusBadge source={DEGRADED_SOURCE} />
      <SourceStatusBadge source={DOWN_SOURCE} />
      <SourceLoginBadge source={LOCKED_SOURCE} />
    </Stack>
  ),
};

export const CardWithSkeleton: Story = {
  name: 'Карточка рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={360}
      item={<SourceCard source={OK_SOURCE} />}
      skeleton={<SourceCardSkeleton />}
    />
  ),
};

export const TitleWithSkeleton: Story = {
  name: 'Заголовок рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={280}
      item={<SourceTitle source={OK_SOURCE} />}
      skeleton={<SourceTitleSkeleton />}
    />
  ),
};
