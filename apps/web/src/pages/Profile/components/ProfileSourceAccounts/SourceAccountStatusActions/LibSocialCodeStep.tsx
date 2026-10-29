import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SkipForwardIcon } from '@phosphor-icons/react';
import { LIBSOCIAL_LOGIN_CODE_LENGTH, type LibSocialLoginStep } from '@tanuki/contracts';
import CodeConfirmationForm from '@/shared/ui/CodeConfirmationForm';
import useConfirmLibSocialLogin from '../hooks/useConfirmLibSocialLogin';
import useSkipLibSocialLogin from '../hooks/useSkipLibSocialLogin';

type Props = {
  site: string;
  /** Модалка применяет ответ, только пока попытка входа актуальна. */
  onStep: (operation: () => Promise<LibSocialLoginStep>) => Promise<void>;
};

function LibSocialCodeStep({ site, onStep }: Props) {
  const { t } = useTranslation();
  const confirmLogin = useConfirmLibSocialLogin();
  const skipLogin = useSkipLibSocialLogin();

  return (
    <CodeConfirmationForm
      length={LIBSOCIAL_LOGIN_CODE_LENGTH}
      description={t('codeForSiteSentToAccountEmail', { site })}
      isConfirming={confirmLogin.isPending}
      disabled={skipLogin.isPending}
      onConfirm={(code) => onStep(() => confirmLogin.mutateAsync({ code }))}
      actions={(reset, reportError) => (
        <Button
          variant="default"
          leftSection={<SkipForwardIcon />}
          loading={skipLogin.isPending}
          disabled={confirmLogin.isPending}
          onClick={() => {
            reset();
            void onStep(() => skipLogin.mutateAsync()).catch(reportError);
          }}
        >
          {t('skipName', { name: site })}
        </Button>
      )}
    />
  );
}

export default LibSocialCodeStep;
