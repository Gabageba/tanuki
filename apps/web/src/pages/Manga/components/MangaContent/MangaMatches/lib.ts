import { MATCH_CONFIDENCE, type MatchConfidence } from '@tanuki/contracts';
import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

export const getMatchConfidenceLabel = (confidence: MatchConfidence) => {
  switch (confidence) {
    case MATCH_CONFIDENCE.CONFIRMED:
      return 'проверено';
    case MATCH_CONFIDENCE.EXACT:
      return 'точное совпадение';
    case MATCH_CONFIDENCE.HIGH:
      return 'вероятно тот же';
    case MATCH_CONFIDENCE.LOW:
      return 'возможно тот же';
  }
};

export const getMatchConfidenceColor = (confidence: MatchConfidence) => {
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

/** Уверенные совпадения показываем сразу, спорные прячем под кат. */
export const isConfidentMatch = (confidence: MatchConfidence) => {
  switch (confidence) {
    case MATCH_CONFIDENCE.CONFIRMED:
    case MATCH_CONFIDENCE.EXACT:
    case MATCH_CONFIDENCE.HIGH:
      return true;
    case MATCH_CONFIDENCE.LOW:
      return false;
  }
};

/**
 * Достаёт идентификатор тайтла из ссылки на его страницу («/manga/:sourceId/:mangaId», в том
 * числе полный URL) и приводит к тому виду, в котором его ждёт API, — «sourceId:mangaId».
 */
export const parseMangaLink = (value: string): string | null => {
  const match = /\/manga\/([^/\s?#]+)\/([^/\s?#]+)/.exec(value.trim());
  if (!match) return null;

  return `${match[1]}:${match[2]}`;
};
