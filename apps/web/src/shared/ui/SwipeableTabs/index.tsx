import { Tabs, type TabsProps } from '@mantine/core';
import useTabSwipe from './hooks/useTabSwipe';

type Props = TabsProps & {
  swipeEnabled?: boolean;
};

/** Обычные Mantine Tabs с переключением по жесту в содержимом. */
function SwipeableTabs({ swipeEnabled = true, ...props }: Props) {
  const enabled = swipeEnabled && props.orientation !== 'vertical';
  const ref = useTabSwipe(enabled);

  return <Tabs {...props} ref={ref} data-swipeable-tabs={enabled || undefined} />;
}

export default SwipeableTabs;
