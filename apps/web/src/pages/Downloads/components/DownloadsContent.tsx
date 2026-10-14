import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useDownloads from '../hooks/useDownloads';
import DownloadsEmpty from './DownloadsEmpty';
import DownloadsTabs from './DownloadsTabs';
import DownloadsUnsupported from './DownloadsUnsupported';

/** Данные локальные и приходят сразу — ни скелетона, ни спиннера: пока база молчит, пусто. */
function DownloadsContent() {
  const { data: user } = useCurrentUser();
  const data = useDownloads();

  if (data === null) return <DownloadsUnsupported />;
  if (!data || !user) return null;
  if (data.rows.length === 0) return <DownloadsEmpty />;

  return <DownloadsTabs userId={user.id} data={data} />;
}

export default DownloadsContent;
