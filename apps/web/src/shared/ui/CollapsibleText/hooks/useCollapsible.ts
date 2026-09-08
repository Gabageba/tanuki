import { useEffect, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';

function useCollapsible<T extends HTMLElement>(content: unknown) {
  const [expanded, { toggle }] = useDisclosure(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (node) {
      setIsClamped(node.scrollHeight > node.clientHeight);
    }
  }, [content]);

  return { ref, expanded, toggle, isClamped };
}

export default useCollapsible;
