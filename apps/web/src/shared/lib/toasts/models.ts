import type { ReactNode } from 'react';
import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { FeedbackTone } from '../feedback';

export const TOAST_KIND = {
  MESSAGE: 'message',
  UNDO: 'undo',
  SECURITY: 'security',
  PWA: 'pwa',
} as const;
export type ToastKind = EnumLiteralsOf<typeof TOAST_KIND>;

export const TOAST_CLOSE_REASON = {
  DISMISS: 'dismiss',
  ACTION: 'action',
  OBSOLETE: 'obsolete',
} as const;
export type ToastCloseReason = EnumLiteralsOf<typeof TOAST_CLOSE_REASON>;

export const TOAST_PAUSE = { HOVER: 'hover', FOCUS: 'focus', CLIPPED: 'clipped' } as const;
export type ToastPause = EnumLiteralsOf<typeof TOAST_PAUSE>;
export const MAX_TOASTS = 3;
export const READ_ERROR_SUPPRESSION_MS = 2_000;

export type ToastInput = {
  id?: string;
  key?: string;
  group?: string;
  tone?: FeedbackTone;
  kind?: ToastKind;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  onOpen?: () => void;
  onDismiss?: () => void;
  readerAllowed?: boolean;
  /** PWA не принадлежит аккаунту; его актуальность определяет производитель. */
  global?: boolean;
  suppressAfterClose?: boolean;
};

export type ToastEntry = Omit<ToastInput, 'id' | 'tone' | 'kind'> & {
  id: string;
  tone: FeedbackTone;
  kind: ToastKind;
  sequence: number;
  revision: number;
  visible: boolean;
  /** Уже включён в стек; false — ещё ждёт первого показа после читалки. */
  presented: boolean;
  remaining: number | null;
  pauses: ReadonlySet<ToastPause>;
  owner: string | null;
};

export type ToastClock = {
  now: () => number;
  schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
};
