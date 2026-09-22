import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import CreateInviteButton from './components/CreateInviteButton';
import InvitesTable from './components/InvitesTable';
import useInvites from './hooks/useInvites';

function Invites() {
  const { t } = useTranslation();

  return (
    <PageLayout useQuery={useInvites}>
      <PageLayout.Content
        title={t('invites')}
        actions={<CreateInviteButton />}
        goBack={{ path: ROUTE_PATHS.SOURCES }}
      >
        <InvitesTable />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Invites;
