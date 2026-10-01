import { SOURCE_ACCESS, type Source } from '@tanuki/contracts';

/** В настройках пометка о входе только там, где войти ещё предстоит: у вошедших её нет. */
export const isSourceLoginOffered = (source: Source) =>
  source.access === SOURCE_ACCESS.RELOGIN_REQUIRED || !source.isLoggedIn;
