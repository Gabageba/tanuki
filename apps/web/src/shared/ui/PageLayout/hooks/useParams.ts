import { useContext } from 'react';
import { PageLayoutParamsContext } from '../context';

function useParams<TParams>() {
  const state = useContext(PageLayoutParamsContext);
  if (!state) {
    throw new Error('PageLayout.useParams must be used within PageLayout');
  }
  return state as unknown as { params: TParams; setParams: (params: TParams) => void };
}

export default useParams;
