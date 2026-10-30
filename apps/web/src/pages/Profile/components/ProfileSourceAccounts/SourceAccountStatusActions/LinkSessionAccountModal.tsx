import { SignInIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Source, SourceAuthFamily } from '@tanuki/contracts';
import { getSourceAuthFamilyTitle } from '@/entities/source-account/lib';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import SourceSessionForm from './SourceSessionForm';

type Props = {
  family: SourceAuthFamily;
  cookieName: string;
  description: string;
  source: Source | undefined;
  opened: boolean;
  onClose: () => void;
};

function LinkSessionAccountModal({
  family,
  cookieName,
  description,
  source,
  opened,
  onClose,
}: Props) {
  const { t } = useTranslation();
  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={SignInIcon}
      opened={opened}
      onClose={onClose}
      title={t('logInToName', { name: getSourceAuthFamilyTitle(family) })}
    >
      <SourceSessionForm
        family={family}
        cookieName={cookieName}
        description={description}
        source={source}
        onClose={onClose}
      />
    </ToneModal>
  );
}

export default LinkSessionAccountModal;
