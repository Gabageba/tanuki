import type { EnumLiteralsOf } from '@tanuki/contracts';
import {
  PRIMARY_COLOR,
  STATUS_DEGRADED_COLOR,
  STATUS_DOWN_COLOR,
  STATUS_OK_COLOR,
} from './palette';

export const FEEDBACK_TONE = {
  ACCENT: 'accent',
  DANGER: 'danger',
  WARNING: 'warning',
  SUCCESS: 'success',
  NEUTRAL: 'neutral',
} as const;
export type FeedbackTone = EnumLiteralsOf<typeof FEEDBACK_TONE>;

export const getToneColor = (tone: FeedbackTone) => {
  switch (tone) {
    case FEEDBACK_TONE.ACCENT:
      return PRIMARY_COLOR;
    case FEEDBACK_TONE.DANGER:
      return STATUS_DOWN_COLOR;
    case FEEDBACK_TONE.WARNING:
      return STATUS_DEGRADED_COLOR;
    case FEEDBACK_TONE.SUCCESS:
      return STATUS_OK_COLOR;
    case FEEDBACK_TONE.NEUTRAL:
      return 'gray';
  }
};

export const getToneToastDuration = (tone: FeedbackTone) => {
  switch (tone) {
    case FEEDBACK_TONE.DANGER:
      return 10_000;
    case FEEDBACK_TONE.WARNING:
      return 8_000;
    case FEEDBACK_TONE.ACCENT:
    case FEEDBACK_TONE.SUCCESS:
    case FEEDBACK_TONE.NEUTRAL:
      return 5_000;
  }
};
