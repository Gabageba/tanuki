import { Group, SegmentedControl, Switch } from '@mantine/core';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';
import {
  APPROXIMATE_STYLE,
  STACK_SIZES,
  type ApproximateStyle,
  type DemoBranch,
  type StackSize,
} from '../models';
import { getApproximateStyleLabel } from '../lib';
import Control from './DemoControl';

type Props = {
  branches: DemoBranch[];
  branchId: string;
  onBranchChange: (branchId: string) => void;
  direction: SortDirection;
  onDirectionChange: (direction: SortDirection) => void;
  approximateStyle: ApproximateStyle;
  onApproximateStyleChange: (style: ApproximateStyle) => void;
  stackSize: StackSize;
  onStackSizeChange: (size: StackSize) => void;
  withLegend: boolean;
  onLegendChange: (withLegend: boolean) => void;
  isMobile: boolean;
  onMobileChange: (isMobile: boolean) => void;
};

function DemoControls({
  branches,
  branchId,
  onBranchChange,
  direction,
  onDirectionChange,
  approximateStyle,
  onApproximateStyleChange,
  stackSize,
  onStackSizeChange,
  withLegend,
  onLegendChange,
  isMobile,
  onMobileChange,
}: Props) {
  return (
    <Group gap="lg" align="flex-end">
      <Control label="Ветка">
        <SegmentedControl
          size="xs"
          value={branchId}
          onChange={onBranchChange}
          data={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
        />
      </Control>
      <Control label="Сортировка">
        <SegmentedControl
          size="xs"
          value={direction}
          onChange={(value) =>
            onDirectionChange(
              value === SORT_DIRECTION.ASC ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC,
            )
          }
          data={[
            { value: SORT_DIRECTION.DESC, label: 'Новые сверху' },
            { value: SORT_DIRECTION.ASC, label: 'Старые сверху' },
          ]}
        />
      </Control>
      <Control label="Примерное место">
        <SegmentedControl
          size="xs"
          value={approximateStyle}
          onChange={(value) =>
            onApproximateStyleChange(
              Object.values(APPROXIMATE_STYLE).find((style) => style === value) ??
                APPROXIMATE_STYLE.QUESTION_BADGE,
            )
          }
          data={Object.values(APPROXIMATE_STYLE).map((style) => ({
            value: style,
            label: getApproximateStyleLabel(style),
          }))}
        />
      </Control>
      <Control label="Источников на гл. 10">
        <SegmentedControl
          size="xs"
          ff="monospace"
          value={String(stackSize)}
          onChange={(value) =>
            onStackSizeChange(STACK_SIZES.find((size) => String(size) === value) ?? 2)
          }
          data={STACK_SIZES.map((size) => String(size))}
        />
      </Control>
      <Switch
        label="Легенда над списком"
        checked={withLegend}
        onChange={(event) => onLegendChange(event.currentTarget.checked)}
      />
      <Switch
        label="Ширина мобилки (375px)"
        checked={isMobile}
        onChange={(event) => onMobileChange(event.currentTarget.checked)}
      />
    </Group>
  );
}

export default DemoControls;
