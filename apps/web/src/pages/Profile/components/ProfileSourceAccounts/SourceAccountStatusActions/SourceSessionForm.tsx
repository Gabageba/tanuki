import { Anchor, Button, List, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Trans, useTranslation } from 'react-i18next';
import { CookieIcon, SignInIcon } from '@phosphor-icons/react';
import {
  type LinkSourceSessionRequest,
  type Source,
  type SourceAuthFamily,
} from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateRequired } from '@/shared/lib/authValidation';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import useLinkSourceSession from '../hooks/useLinkSourceSession';

type Props = {
  family: SourceAuthFamily;
  cookieName: string;
  description: string;
  source: Source | undefined;
  onClose: () => void;
};

/** Привязка аккаунта переносом cookie сессии из браузера. */
function SourceSessionForm({ family, cookieName, description, source, onClose }: Props) {
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
      { family, ...values },
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
    <form onSubmit={handleSubmit}>
      <Stack>
        <Text c="dimmed" fz={13}>
          {description}
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
              values={{ name: cookieName }}
              components={{ name: <Text span inherit ff="monospace" /> }}
            />
          </List.Item>
          <List.Item>{t('closeWindowKeepSession')}</List.Item>
        </List>
        <Textarea
          placeholder={t('cookieValue', { name: cookieName })}
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
  );
}

export default SourceSessionForm;
