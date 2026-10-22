import useInvites from '../components/ManagementInvites/hooks/useInvites';
import { DEFAULT_INVITES_QUERY } from '../components/ManagementInvites/models';
import useManagedUsers from '../components/ManagementUsers/hooks/useManagedUsers';
import { DEFAULT_USERS_QUERY } from '../components/ManagementUsers/models';

/** Запросы страницы для PageLayout — первые страницы обеих вкладок без фильтров. Вкладки смонтированы
 *  обе и с теми же ключами, так что лишних запросов нет; упади обе разом — страница покажет ошибку,
 *  упавшая одна — пустой блок. */
function useManagementQueries() {
  return {
    users: useManagedUsers(DEFAULT_USERS_QUERY),
    invites: useInvites(DEFAULT_INVITES_QUERY),
  };
}

export default useManagementQueries;
