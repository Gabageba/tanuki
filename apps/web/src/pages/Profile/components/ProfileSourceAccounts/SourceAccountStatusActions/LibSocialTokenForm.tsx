import { Anchor, Button, Group, List, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Trans, useTranslation } from 'react-i18next';
import { KeyIcon, SignInIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateRequired } from '@/shared/lib/authValidation';
import useLinkLibSocialToken from '../hooks/useLinkLibSocialToken';

type Props = {
  source: Source;
  onClose: () => void;
};

type FormValues = {
  value: string;
};

/**
 * Запасной путь входа в LibSocial: человек входит на сайте в своём браузере и переносит токен
 * из localStorage выбранного сайта.
 */
function LibSocialTokenForm({ source, onClose }: Props) {
  const { t } = useTranslation();
  const linkToken = useLinkLibSocialToken();

  const form = useForm<FormValues>({
    initialValues: { value: '' },
    validate: { value: validateRequired(t) },
  });

  const handleSubmit = form.onSubmit((values) => {
    linkToken.mutate(
      { ...values, sourceId: source.id },
      {
        onSuccess: onClose,
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
        <List type="ordered" spacing="xs" fz="sm">
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
          <List.Item>{t('openDevToolsLocalStorage')}</List.Item>
          <List.Item>
            <Trans
              i18nKey="copyAuthKeyValue"
              components={{ key: <Text span inherit ff="monospace" /> }}
            />
          </List.Item>
          <List.Item>{t('closeWindowWithoutLoggingOut')}</List.Item>
        </List>
        <Textarea
          placeholder={t('authKeyValue')}
          leftSection={<KeyIcon />}
          autosize
          minRows={3}
          maxRows={6}
          ff="monospace"
          data-autofocus
          {...form.getInputProps('value')}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" leftSection={<SignInIcon />} loading={linkToken.isPending}>
            {t('logIn')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export default LibSocialTokenForm;
