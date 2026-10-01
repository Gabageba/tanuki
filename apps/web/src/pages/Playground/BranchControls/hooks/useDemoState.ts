import { useState } from 'react';
import { SORT_DIRECTION, type Branch, type SortDirection } from '@tanuki/contracts';
import { DEMO_BRANCHES } from '../mocks';

/** Своя ветка и своя сортировка у каждого варианта — выбор в одном не двигает соседей. */
function useDemoState() {
  const [branchId, setBranchId] = useState(DEMO_BRANCHES[0]?.id ?? '');
  const [direction, setDirection] = useState<SortDirection>(SORT_DIRECTION.DESC);
  const branch = DEMO_BRANCHES.find((item) => item.id === branchId) as Branch;

  return { branches: DEMO_BRANCHES, branch, setBranchId, direction, setDirection };
}

export default useDemoState;
