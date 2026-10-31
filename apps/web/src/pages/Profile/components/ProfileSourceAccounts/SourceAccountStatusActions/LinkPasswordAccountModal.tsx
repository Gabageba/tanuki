import { useTranslation } from 'react-i18next';
import { SignInIcon } from '@phosphor-icons/react';
import { SOURCE_AUTH_FAMILY, type SourceAuthFamily } from '@tanuki/contracts';
import useLinkSourceAccount from '../hooks/useLinkSourceAccount';
import { getSourceAuthFamilyTitle } from '@/entities/source-account/lib';
import PasswordAccountForm from './PasswordAccountForm';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  family: SourceAuthFamily;
  opened: boolean;
  onClose: () => void;
};

/** Сервер входит в аккаунт источника с этими данными. */
function LinkPasswordAccountModal({ family, opened, onClose }: Props) {
  const { t } = useTranslation();
  const linkAccount = useLinkSourceAccount();

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={SignInIcon}
      opened={opened}
      onClose={onClose}
      title={t('logInToName', { name: getSourceAuthFamilyTitle(family) })}
    >
      <PasswordAccountForm
        emailOnly={family === SOURCE_AUTH_FAMILY.TOMILOLIB}
        isPending={linkAccount.isPending}
        onSubmit={(values) => linkAccount.mutateAsync({ family, ...values }).then(onClose)}
        onCancel={onClose}
      />
    </ToneModal>
  );
}

export default LinkPasswordAccountModal;
