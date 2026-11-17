import { Tabs, type TabsProps } from '@mantine/core';
import { startTransition, useContext, useOptimistic } from 'react';
import { QueryTransitionContext } from '@/shared/ui/QueryBlock/context';
import useTabSwipe from './hooks/useTabSwipe';

type Props = TabsProps & {
  swipeEnabled?: boolean;
};

/** Обычные Mantine Tabs с переключением по жесту в содержимом. */
function SwipeableTabs({ swipeEnabled = true, value, onChange, ...props }: Props) {
  const isParentTransitioning = useContext(QueryTransitionContext);
  const [selectedValue, setSelectedValue] = useOptimistic(value);
  const enabled = swipeEnabled && props.orientation !== 'vertical';
  const ref = useTabSwipe(enabled, selectedValue);

  const handleChange = (next: string | null) => {
    if (value === undefined || !onChange) {
      onChange?.(next);
      return;
    }
    // Подчёркивание меняется срочно, а URL и тяжёлое содержимое — прерываемым переходом.
    startTransition(() => {
      setSelectedValue(next);
      return onChange(next);
    });
  };

  return (
    <QueryTransitionContext.Provider value={isParentTransitioning || selectedValue !== value}>
      <Tabs
        {...props}
        value={selectedValue}
        onChange={handleChange}
        ref={ref}
        data-swipeable-tabs={enabled || undefined}
      />
    </QueryTransitionContext.Provider>
  );
}

export default SwipeableTabs;
