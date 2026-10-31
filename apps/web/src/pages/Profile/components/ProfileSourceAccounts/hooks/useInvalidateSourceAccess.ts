import { useQueryClient } from '@tanstack/react-query';
import { SOURCE_ACCOUNTS_QUERY_KEY } from '@/entities/source-account/hooks/useSourceAccounts';

/**
 * После привязки или отвязки меняется доступ к источникам — а с ним каталог, поиск и всё, что
 * уже упало с «источник закрыт». Проще перезапросить всё, чем перечислять ключи.
 */
function useInvalidateSourceAccess() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SOURCE_ACCOUNTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
      queryClient.resetQueries({ predicate: (query) => query.state.status === 'error' }),
    ]);
}

export default useInvalidateSourceAccess;
