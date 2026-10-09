import type { ReactNode } from 'react';
import { VIEW_MODE } from '@tanuki/contracts';
import { VIEW_MODE_CONTEXT } from '../models';

type Props = {
  children: ReactNode;
};

const LIST_MODE = { viewMode: VIEW_MODE.LIST, setViewMode: () => {} };

/** Ось V про вид «список» — он включён здесь всегда, независимо от переключателя страницы. */
function ForcedListMode({ children }: Props) {
  return <VIEW_MODE_CONTEXT value={LIST_MODE}>{children}</VIEW_MODE_CONTEXT>;
}

export default ForcedListMode;
