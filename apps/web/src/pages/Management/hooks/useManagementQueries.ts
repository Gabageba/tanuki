import useManagementUsersQuery from './useManagementUsersQuery';
import useManagementInvitesQuery from './useManagementInvitesQuery';

/** Запросы обеих таблиц с теми же параметрами URL, что и в содержимом вкладок. */
function useManagementQueries() {
  const { query: users } = useManagementUsersQuery();
  const { query: invites } = useManagementInvitesQuery();

  return {
    users,
    invites,
  };
}

export default useManagementQueries;
