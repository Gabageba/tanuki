import { canShow, getPriority, isProtected } from './lib';
import { MAX_VISIBLE, TOAST_KIND, type DemoState, type DemoToast } from './models';

/** Только модель демонстрации: не подключается к рабочим уведомлениям. */
export const fillSlots = (state: DemoState): DemoState => {
  const visible = [...state.visible];
  const pending = [...state.pending];
  while (visible.length < MAX_VISIBLE) {
    const eligible = pending.filter((toast) => canShow(toast, state.reader));
    const next = eligible.reduce<DemoToast | undefined>(
      (best, item) => (!best || getPriority(item) > getPriority(best) ? item : best),
      undefined,
    );
    if (!next) break;
    pending.splice(pending.indexOf(next), 1);
    visible.push(next);
  }
  return { ...state, visible, pending };
};

export const offerToast = (state: DemoState, toast: DemoToast): DemoState => {
  if (state.visible.some((item) => item.id === toast.id)) {
    return {
      ...state,
      visible: state.visible.map((item) =>
        item.id === toast.id ? { ...toast, remaining: item.remaining } : item,
      ),
    };
  }
  if (state.pending.some((item) => item.id === toast.id)) {
    return {
      ...state,
      pending: state.pending.map((item) =>
        item.id === toast.id ? { ...toast, remaining: item.remaining } : item,
      ),
    };
  }
  if (
    !canShow(toast, state.reader) ||
    state.visible.length < MAX_VISIBLE ||
    toast.kind === TOAST_KIND.PWA
  ) {
    return fillSlots({ ...state, pending: [...state.pending, toast] });
  }
  const pwa = state.visible.find(
    (item) => item.kind === TOAST_KIND.PWA && !state.focused.includes(item.id),
  );
  const displaced =
    pwa ?? state.visible.find((item) => !isProtected(item) && !state.focused.includes(item.id));
  if (!displaced) return { ...state, pending: [...state.pending, toast] };
  return fillSlots({
    ...state,
    visible: state.visible.filter((item) => item.id !== displaced.id),
    pending: [...state.pending, toast, ...(displaced.kind === TOAST_KIND.PWA ? [displaced] : [])],
    hovered: state.hovered.filter((id) => id !== displaced.id),
    focused: state.focused.filter((id) => id !== displaced.id),
  });
};

export const removeToast = (state: DemoState, id: string) =>
  fillSlots({
    ...state,
    visible: state.visible.filter((item) => item.id !== id),
    pending: state.pending.filter((item) => item.id !== id),
    hovered: state.hovered.filter((item) => item !== id),
    focused: state.focused.filter((item) => item !== id),
  });

export const setReaderMode = (state: DemoState, reader: boolean) =>
  fillSlots({
    ...state,
    reader,
    visible: state.visible.filter((item) => canShow(item, reader)),
    pending: [...state.pending, ...state.visible.filter((item) => !canShow(item, reader))],
  });

export const advanceTime = (state: DemoState, elapsed: number) => {
  const visible = state.visible.map((item) =>
    item.remaining === null || state.hovered.includes(item.id) || state.focused.includes(item.id)
      ? item
      : { ...item, remaining: Math.max(0, item.remaining - elapsed) },
  );
  return fillSlots({
    ...state,
    visible: visible.filter((item) => item.remaining === null || item.remaining > 0),
  });
};
