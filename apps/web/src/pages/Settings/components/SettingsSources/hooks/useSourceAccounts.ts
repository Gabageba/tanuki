import { useQuery } from '@tanstack/react-query';
import type { SourceAccountsResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const SOURCE_ACCOUNTS_QUERY_KEY = ['sourceAccounts'];

function useSourceAccounts() {
  return useQuery({
    queryKey: SOURCE_ACCOUNTS_QUERY_KEY,
    queryFn: () => apiFetch<SourceAccountsResponse>('/source-accounts'),
  });
}

export default useSourceAccounts;
