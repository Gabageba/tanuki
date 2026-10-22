import { useState } from 'react';
import { Group, SegmentedControl, Stack } from '@mantine/core';
import SandboxOnly from '../../components/SandboxOnly';
import { getDistinctFlowSteps, getSummaryStateLabel } from '../lib';
import { getMockPreview } from '../mocks';
import { RESTORE_STEP, SUMMARY_STATE, type FlowSplit, type SummaryState } from '../models';
import CaptionedFrame from './CaptionedFrame';
import RestoreFlow from './RestoreFlow';

type Props = {
  split: FlowSplit;
  withConfirm?: boolean;
};

/** Шаги, которыми ★1 и ★2 различаются, — рядом, каждый открыт на своём шаге и живой дальше; плюс
 *  сводка в рамке телефона. Какую копию «выбрали», меняет переключатель песочницы. */
function FinalFlowDemo({ split, withConfirm = true }: Props) {
  const [state, setState] = useState<SummaryState>(SUMMARY_STATE.CONFLICTS);
  const preview = getMockPreview(state);

  return (
    <Stack gap="lg">
      <SandboxOnly>
        <SegmentedControl
          size="xs"
          value={state}
          onChange={(value) => setState(value as SummaryState)}
          data={Object.values(SUMMARY_STATE).map((value) => ({
            value,
            label: getSummaryStateLabel(value),
          }))}
        />
      </SandboxOnly>
      <Group align="flex-start" gap="lg">
        {getDistinctFlowSteps(split, preview, withConfirm).map(({ step, caption }) => (
          <CaptionedFrame key={`${state}-${step}`} caption={caption}>
            <RestoreFlow
              split={split}
              preview={preview}
              initialStep={step}
              withConfirm={withConfirm}
            />
          </CaptionedFrame>
        ))}
        <CaptionedFrame caption="375 px · Шаг 2">
          <RestoreFlow
            key={state}
            split={split}
            preview={preview}
            initialStep={RESTORE_STEP.SUMMARY}
            withConfirm={withConfirm}
            isPhone
          />
        </CaptionedFrame>
      </Group>
    </Stack>
  );
}

export default FinalFlowDemo;
