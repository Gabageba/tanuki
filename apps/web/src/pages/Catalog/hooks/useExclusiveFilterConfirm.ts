import { useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import { applyExclusiveGroups, groupHasSelection } from '../utils/filterSelection';

type PendingChange = {
  groups: FilterGroup[];
  group: FilterGroup;
  next: FilterSelection[];
  commit: (selection: FilterSelection[]) => void;
};

/**
 * Gates a filter change through a confirm step when it's about to clear a sibling
 * `exclusiveGroup` selection (manga-chan.me: tags / "Тип" / "Статус" can't combine on the
 * source) — the user can opt out of future prompts, remembered in localStorage.
 */
function useExclusiveFilterConfirm() {
  const [dismissed, setDismissed] = useLocalStorage({
    key: 'tanuki-catalog-filter-exclusive-confirm-dismissed',
    defaultValue: false,
  });
  const [pending, setPending] = useState<PendingChange | null>(null);

  const applyChange = (
    groups: FilterGroup[],
    group: FilterGroup,
    selection: FilterSelection[],
    next: FilterSelection[],
    commit: (selection: FilterSelection[]) => void,
  ) => {
    const conflict = group.exclusiveGroup
      ? groups.some(
          (sibling) =>
            sibling.id !== group.id &&
            sibling.exclusiveGroup === group.exclusiveGroup &&
            groupHasSelection(selection, sibling.id),
        )
      : false;

    if (!conflict || dismissed) {
      commit(applyExclusiveGroups(groups, group, next));
      return;
    }
    setPending({ groups, group, next, commit });
  };

  const confirmPending = (rememberChoice: boolean) => {
    if (!pending) return;
    if (rememberChoice) setDismissed(true);
    pending.commit(applyExclusiveGroups(pending.groups, pending.group, pending.next));
    setPending(null);
  };

  const cancelPending = () => setPending(null);

  return { applyChange, pending, confirmPending, cancelPending };
}

export default useExclusiveFilterConfirm;
