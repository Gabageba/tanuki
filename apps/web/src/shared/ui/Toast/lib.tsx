import { CheckCircleIcon, InfoIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { FEEDBACK_TONE, type FeedbackTone } from '@/shared/lib/feedback';

export const getToastIcon = (tone: FeedbackTone) => {
  switch (tone) {
    case FEEDBACK_TONE.DANGER:
      return <WarningCircleIcon size={20} />;
    case FEEDBACK_TONE.WARNING:
      return <WarningCircleIcon size={20} />;
    case FEEDBACK_TONE.SUCCESS:
      return <CheckCircleIcon size={20} />;
    case FEEDBACK_TONE.ACCENT:
    case FEEDBACK_TONE.NEUTRAL:
      return <InfoIcon size={20} />;
  }
};
