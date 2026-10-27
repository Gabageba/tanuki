import { Anchor, Button, List, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Trans, useTranslation } from 'react-i18next';
import { CookieIcon, SignInIcon } from '@phosphor-icons/react';
import { SOURCE_AUTH_FAMILY, type LinkSourceSessionRequest, type Source } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateRequired } from '@/shared/lib/authValidation';
import { getSourceAuthFamilyTitle } from '@/entities/source-account/lib';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import useLinkSourceSession from '../hooks/useLinkSourceSession';

/** Cookie сессии inkstory.net — её человек и переносит. */
const SESSION_COOKIE = '__otaku_session';

type Props = {
  source: Source | undefined;
  opened: boolean;
  onClose: () => void;
};

/**
 * Inkstory: вход на SSO сети закрыт капчей, поэтому сервер не входит сам — человек входит на
 * сайте в своём браузере и переносит cookie сессии.
 */
function LinkInkStoryModal({ source, opened, onClose }: Props) {
  const { t } = useTranslation();
  const linkSession = useLinkSourceSession();

  const form = useForm<LinkSourceSessionRequest>({
    initialValues: { value: '' },
    validate: { value: validateRequired(t) },
  });

  const close = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = form.onSubmit((values) => {
    linkSession.mutate(
      { family: SOURCE_AUTH_FAMILY.INKSTORY, ...values },
      {
        onSuccess: close,
        onError: (error) =>
          form.setFieldError(
            'value',
            error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
          ),
      },
    );
  });

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={SignInIcon}
      opened={opened}
      onClose={close}
      title={t('logInToName', { name: getSourceAuthFamilyTitle(SOURCE_AUTH_FAMILY.INKSTORY) })}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <Text c="dimmed" fz={13}>
            {t('loginProtectedByCaptcha')}
          </Text>
          <List type="ordered" spacing="xs" fz="sm">
            {source && (
              <List.Item>
                <Trans
                  i18nKey="openSiteInPrivateWindow"
                  values={{ site: source.domain }}
                  components={{
                    site: (
                      <Anchor
                        href={`https://${source.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        ff="monospace"
                        fz="sm"
                      />
                    ),
                  }}
                />
              </List.Item>
            )}
            <List.Item>{t('openDevToolsCookies')}</List.Item>
            <List.Item>
              <Trans
                i18nKey="copyCookieValue"
                values={{ name: SESSION_COOKIE }}
                components={{ name: <Text span inherit ff="monospace" /> }}
              />
            </List.Item>
            <List.Item>{t('closeWindowKeepSession')}</List.Item>
          </List>
          <Textarea
            placeholder={t('cookieValue', { name: SESSION_COOKIE })}
            leftSection={<CookieIcon />}
            autosize
            minRows={2}
            maxRows={4}
            ff="monospace"
            data-autofocus
            {...form.getInputProps('value')}
          />
          <ModalButtonsLayout>
            <Button variant="default" onClick={close}>
              {t('cancel')}
            </Button>
            <Button type="submit" leftSection={<SignInIcon />} loading={linkSession.isPending}>
              {t('logIn')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default LinkInkStoryModal;
