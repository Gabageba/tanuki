import type { MantineBreakpoint } from '@mantine/core';
import { Divider, Group, Skeleton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { XXS_QUERY } from '@/shared/lib/breakpoints';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import styles from '../../ReaderPage.module.scss';

type Props = {
  visibleFrom?: MantineBreakpoint;
  hiddenFrom?: MantineBreakpoint;
};

function ReaderControlsSkeleton({ visibleFrom, hiddenFrom }: Props) {
  const isXxs = useMediaQuery(XXS_QUERY, false);
  const outerGap = isXxs ? 'md' : 'xs';
  const innerGap = isXxs ? 'xs' : 4;

  return (
    <Group visibleFrom={visibleFrom} hiddenFrom={hiddenFrom} h="100%" gap={outerGap} wrap="nowrap">
      <Group gap={innerGap} miw={0} wrap="nowrap">
        <Skeleton w={34} h={34} flex="none" />
        <Skeleton w={{ base: 140, md: 300 }} h={36} />
        <Skeleton w={34} h={34} flex="none" />
      </Group>
      <Divider orientation="vertical" h={26} className={styles.divider} />
      <Group gap={innerGap} wrap="nowrap" style={{ flexShrink: 0 }}>
        <TextSkeleton fz={12} w={50} visibleFrom="md" />
        <Skeleton w={34} h={34} flex="none" />
        <Skeleton w={34} h={34} flex="none" />
      </Group>
    </Group>
  );
}

export default ReaderControlsSkeleton;
