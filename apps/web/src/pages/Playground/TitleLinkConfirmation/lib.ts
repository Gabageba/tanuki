import {
  MATCH_CONFIDENCE,
  TITLE_LINK_VERDICT,
  type MatchConfidence,
  type TitleLinkVerdict,
} from '@tanuki/contracts';
import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import { MATCHES } from './mocks';

export const getVisibleMatchGroups = (verdicts: Partial<Record<string, TitleLinkVerdict>>) => {
  const matches = MATCHES.map((match, index) => ({
    ...match,
    index,
    verdict: verdicts[match.title.id],
    confidence: getEffectiveConfidence(match.confidence, verdicts[match.title.id]),
  })).filter(({ verdict }) => verdict !== TITLE_LINK_VERDICT.REJECTED);

  return Object.values(MATCH_CONFIDENCE)
    .map((confidence) => ({
      confidence,
      matches: matches.filter((match) => match.confidence === confidence),
    }))
    .filter((group) => group.matches.length > 0);
};

export const getConfidenceColor = (confidence: MatchConfidence) => {
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

export const getEffectiveConfidence = (
  confidence: MatchConfidence,
  verdict: TitleLinkVerdict = TITLE_LINK_VERDICT.NONE,
) => {
  switch (verdict) {
    case TITLE_LINK_VERDICT.CONFIRMED:
      return MATCH_CONFIDENCE.CONFIRMED;
    case TITLE_LINK_VERDICT.REJECTED:
    case TITLE_LINK_VERDICT.NONE:
      switch (confidence) {
        case MATCH_CONFIDENCE.CONFIRMED:
          return MATCH_CONFIDENCE.EXACT;
        case MATCH_CONFIDENCE.EXACT:
        case MATCH_CONFIDENCE.HIGH:
        case MATCH_CONFIDENCE.LOW:
          return confidence;
      }
  }
};

/** Та же проверка ссылки, что в текущей форме ручного добавления. */
export const parseTitleLink = (value: string): string | null => {
  const targetId = /\/title\/([^/\s?#]+)/.exec(value.trim())?.[1];
  return targetId?.includes(':') ? targetId : null;
};

export const getConfidenceLabel = (confidence: MatchConfidence) => {
  switch (confidence) {
    case MATCH_CONFIDENCE.CONFIRMED:
      return 'Подтверждено';
    case MATCH_CONFIDENCE.EXACT:
      return 'Точное совпадение';
    case MATCH_CONFIDENCE.HIGH:
      return 'Вероятно';
    case MATCH_CONFIDENCE.LOW:
      return 'Сомнительно';
  }
};

export const getVerdictLabel = (verdict: TitleLinkVerdict) => {
  switch (verdict) {
    case TITLE_LINK_VERDICT.CONFIRMED:
      return 'Связь подтверждена';
    case TITLE_LINK_VERDICT.REJECTED:
      return 'Кандидат отклонён';
    case TITLE_LINK_VERDICT.NONE:
      return 'Решение ещё не принято';
  }
};
