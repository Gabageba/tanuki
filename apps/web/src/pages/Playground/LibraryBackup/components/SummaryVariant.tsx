import { Group } from '@mantine/core';
import { getSummaryStateLabel } from '../lib';
import { getMockPreview } from '../mocks';
import type { RestoreChoices, SummaryLayout, SummaryState } from '../models';
import CaptionedFrame from './CaptionedFrame';
import SummaryModal from './SummaryModal';

type Props = {
  layout?: Partial<SummaryLayout>;
  /** Состояния в ширине десктопа. */
  states: SummaryState[];
  /** Какое из них ещё и в рамке телефона. */
  phoneState: SummaryState;
  initialChoices?: Partial<RestoreChoices>;
};

/** Вариант сводки в нескольких состояниях рядом и в рамке телефона. */
function SummaryVariant({ layout, states, phoneState, initialChoices }: Props) {
  return (
    <Group align="flex-start" gap="lg">
      {states.map((state) => (
        <CaptionedFrame key={state} caption={getSummaryStateLabel(state)}>
          <SummaryModal
            preview={getMockPreview(state)}
            layout={layout}
            initialChoices={initialChoices}
          />
        </CaptionedFrame>
      ))}
      <CaptionedFrame caption={`375 px · ${getSummaryStateLabel(phoneState)}`}>
        <SummaryModal
          preview={getMockPreview(phoneState)}
          layout={layout}
          initialChoices={initialChoices}
          isPhone
        />
      </CaptionedFrame>
    </Group>
  );
}

export default SummaryVariant;
