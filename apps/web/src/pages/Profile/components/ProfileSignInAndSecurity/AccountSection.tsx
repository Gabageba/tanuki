import { useTranslation } from 'react-i18next';
import { EnvelopeSimpleIcon, PasswordIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { useDisclosure } from '@mantine/hooks';
import GroupedList from '@/shared/ui/GroupedList';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import ChangeEmailModal from './ChangeEmailModal';
import ChangePasswordModal from './ChangePasswordModal';

const PASSWORD_MASK = '••••••••';

function AccountSection() {
  const { t } = useTranslation();
  const { data: user, isPending: isUserPending } = useCurrentUser();

  const [emailModalOpened, { open: openEmailModal, close: closeEmailModal }] = useDisclosure(false);
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] =
    useDisclosure(false);

  if (!user) return null;

  return (
    <>
      <GroupedList label={t('account')} skeletonRows={2} loading={isUserPending}>
        <GroupedList.Row
          description={user.email}
          title={t('email')}
          icon={<EnvelopeSimpleIcon />}
          actionProps={{
            leftSection: <PencilSimpleIcon />,
            onClick: openEmailModal,
            children: t('change'),
          }}
        />
        <GroupedList.Row
          description={PASSWORD_MASK}
          title={t('password')}
          icon={<PasswordIcon />}
          actionProps={{
            leftSection: <PencilSimpleIcon />,
            onClick: openPasswordModal,
            children: t('change'),
          }}
        />
      </GroupedList>
      <ChangeEmailModal opened={emailModalOpened} onClose={closeEmailModal} />
      <ChangePasswordModal opened={passwordModalOpened} onClose={closePasswordModal} />
    </>
  );
}

export default AccountSection;
