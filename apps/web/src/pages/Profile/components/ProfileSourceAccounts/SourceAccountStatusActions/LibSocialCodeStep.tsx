import { useTranslation } from 'react-i18next';
import {
  LIBSOCIAL_LOGIN_CODE_LENGTH,
  type LibSocialLoginStep,
  type Source,
} from '@tanuki/contracts';
import CodeConfirmationForm from '@/shared/ui/CodeConfirmationForm';
import useConfirmLibSocialLogin from '../hooks/useConfirmLibSocialLogin';

type Props = {
  source: Source;
  /** Модалка применяет ответ, только пока попытка входа актуальна. */
  onStep: (operation: () => Promise<LibSocialLoginStep>) => Promise<void>;
};

function LibSocialCodeStep({ source, onStep }: Props) {
  const { t } = useTranslation();
  const confirmLogin = useConfirmLibSocialLogin();

  return (
    <CodeConfirmationForm
      length={LIBSOCIAL_LOGIN_CODE_LENGTH}
      description={t('codeForSiteSentToAccountEmail', { site: source.title })}
      isConfirming={confirmLogin.isPending}
      onConfirm={(code) => onStep(() => confirmLogin.mutateAsync({ sourceId: source.id, code }))}
    />
  );
}

export default LibSocialCodeStep;
