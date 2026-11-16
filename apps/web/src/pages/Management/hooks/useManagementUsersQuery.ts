import { useDebouncedValue } from '@mantine/hooks';
import useUrlState from '@/shared/hooks/useUrlState';
import useManagedUsers from '../components/ManagementUsers/hooks/useManagedUsers';
import { readListParams, SEARCH_DEBOUNCE_MS } from '../components/ManagementUsers/models';

function useManagementUsersQuery() {
  const { params, setParams } = useUrlState(readListParams, 'users.');
  const [query] = useDebouncedValue(params.query.trim(), SEARCH_DEBOUNCE_MS);
  const users = useManagedUsers({ ...params, query: query || undefined });

  return { params, setParams, query: users };
}

export default useManagementUsersQuery;
