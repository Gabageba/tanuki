import { Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SourceAuthFamily } from '@tanuki/contracts';
import useLinkSourceAccount from '../hooks/useLinkSourceAccount';
import { getSourceAuthFamilyTitle } from '../lib';
import PasswordAccountForm from './PasswordAccountForm';

type Props = {
  family: SourceAuthFamily;
  opened: boolean;
  onClose: () => void;
};

/** Grouple и AllHentai: сервер сам входит на шлюз источника с этими данными. */
function LinkPasswordAccountModal({ family, opened, onClose }: Props) {
  const { t } = useTranslation();
  const linkAccount = useLinkSourceAccount();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('logInToName', { name: getSourceAuthFamilyTitle(family) })}
      centered
    >
      <PasswordAccountForm
        isPending={linkAccount.isPending}
        onSubmit={(values) => linkAccount.mutateAsync({ family, ...values }).then(onClose)}
        onCancel={onClose}
      />
    </Modal>
  );
}

export default LinkPasswordAccountModal;
