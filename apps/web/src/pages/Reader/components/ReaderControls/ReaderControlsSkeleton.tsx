import type { MantineBreakpoint } from '@mantine/core';
import { Divider, Group, Skeleton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { XXS_QUERY } from '@/shared/lib/breakpoints';
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
    <Group visibleFrom={visibleFrom} hiddenFrom={hiddenFrom} h="100%" gap={outerGap}>
      <Group gap={innerGap} miw={0} wrap="nowrap">
        <Skeleton w={34} h={34} />
        <Skeleton w={300} h={36} />
        <Skeleton w={34} h={34} />
      </Group>
      <Divider orientation="vertical" h={26} className={styles.divider} />
      <Group gap={innerGap} wrap="nowrap" style={{ flexShrink: 0 }}>
        <Skeleton w={50} h={12} visibleFrom="md" />
        <Skeleton w={34} h={34} />
        <Skeleton w={34} h={34} />
      </Group>
    </Group>
  );
}

export default ReaderControlsSkeleton;
