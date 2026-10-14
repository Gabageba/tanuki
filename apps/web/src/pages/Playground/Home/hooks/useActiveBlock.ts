import { useState } from 'react';
import type { HomeBlock } from '../models';

/** Какой блок источника открыт в вариантах S2: сначала — первый, выбор не запоминается. */
function useActiveBlock(blocks: HomeBlock[]) {
  const [activeId, setActiveId] = useState(blocks[0]?.id ?? '');
  const activeIndex = Math.max(
    blocks.findIndex((block) => block.id === activeId),
    0,
  );

  return { activeBlock: blocks[activeIndex], activeIndex, setActiveId };
}

export default useActiveBlock;
