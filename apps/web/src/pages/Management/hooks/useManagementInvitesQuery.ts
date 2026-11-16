import useUrlState from '@/shared/hooks/useUrlState';
import useInvites from '../components/ManagementInvites/hooks/useInvites';
import { readListParams } from '../components/ManagementInvites/models';

function useManagementInvitesQuery() {
  const { params, setParams } = useUrlState(readListParams, 'invites.');
  const invites = useInvites(params);

  return { params, setParams, query: invites };
}

export default useManagementInvitesQuery;
