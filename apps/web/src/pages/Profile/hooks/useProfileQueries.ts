import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import useSources from '@/entities/source/hooks/useSources';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useProfileStatistics from '@/entities/user/hooks/useProfileStatistics';
import useSessions from '../components/ProfileSignInAndSecurity/hooks/useSessions';
import useSourceAccounts from '@/entities/source-account/hooks/useSourceAccounts';

/** Запросы страницы для PageLayout — пользователь и запросы всех вкладок. Вкладки смонтированы все
 *  и с теми же ключами, так что лишних запросов нет; упади все разом — страница покажет ошибку,
 *  упавший один — пустой блок. */
function useProfileQueries() {
  return {
    user: useCurrentUser(),
    statistics: useProfileStatistics(),
    bookmarkFolders: useBookmarkFolders(),
    sessions: useSessions(),
    sources: useSources(),
    sourceAccounts: useSourceAccounts(),
  };
}

export default useProfileQueries;
