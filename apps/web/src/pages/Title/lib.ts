import type { TFunction } from 'i18next';
import type { MatchConfidence } from '@tanuki/contracts';
import { MATCH_CONFIDENCE } from '@tanuki/contracts';
import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

export const getMatchConfidenceLabelByKey = (confidence: MatchConfidence, t: TFunction) => {
  switch (confidence) {
    case MATCH_CONFIDENCE.CONFIRMED:
      return t('confirmed');
    case MATCH_CONFIDENCE.EXACT:
      return t('exactMatch');
    case MATCH_CONFIDENCE.HIGH:
      return t('likely');
    case MATCH_CONFIDENCE.LOW:
      return t('uncertain');
  }
};

export const getMatchConfidenceColorByKey = (confidence: MatchConfidence) => {
  switch (confidence) {
    case MATCH_CONFIDENCE.CONFIRMED:
      return PRIMARY_COLOR;
    case MATCH_CONFIDENCE.EXACT:
      return STATUS_OK_COLOR;
    case MATCH_CONFIDENCE.HIGH:
      return STATUS_DEGRADED_COLOR;
    case MATCH_CONFIDENCE.LOW:
      return 'gray';
  }
};

/**
 * Достаёт составной id тайтла из ссылки на его страницу («/title/sourceId:opaqueId», в том числе
 * полный URL) — он уже в том виде, в котором его ждёт API, — «sourceId:opaqueId».
 */
export const parseTitleLink = (value: string): string | null => {
  const targetId = /\/title\/([^/\s?#]+)/.exec(value.trim())?.[1];
  if (!targetId || !targetId.includes(':')) return null;

  return targetId;
};
