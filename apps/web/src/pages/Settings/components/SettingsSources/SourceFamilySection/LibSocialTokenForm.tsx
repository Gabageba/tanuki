import { Anchor, Button, Group, List, Select, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Trans, useTranslation } from 'react-i18next';
import { GlobeIcon, KeyIcon, SignInIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { validateRequired } from '@/shared/lib/authValidation';
import useLinkLibSocialToken from '../hooks/useLinkLibSocialToken';

type Props = {
  sources: Source[];
  defaultSourceId: string | undefined;
  onClose: () => void;
};

type FormValues = {
  sourceId: string;
  value: string;
};

/**
 * Запасной путь входа в LibSocial: человек входит на сайте в своём браузере и переносит токен
 * из localStorage сайта. Токен у каждого сайта сети свой, поэтому сначала выбирается сайт.
 */
function LibSocialTokenForm({ sources, defaultSourceId, onClose }: Props) {
  const { t } = useTranslation();
  const linkToken = useLinkLibSocialToken();

  const form = useForm<FormValues>({
    initialValues: { sourceId: defaultSourceId ?? sources[0]?.id ?? '', value: '' },
    validate: { sourceId: validateRequired(t), value: validateRequired(t) },
  });

  const source = sources.find((item) => item.id === form.values.sourceId);

  const handleSubmit = form.onSubmit((values) => {
    linkToken.mutate(values, {
      onSuccess: onClose,
      onError: (error) =>
        form.setFieldError(
          'value',
          error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
        ),
    });
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Select
          label={t('site')}
          description={t('tokenWorksOnlyForItsSite')}
          leftSection={<GlobeIcon />}
          data={sources.map((item) => ({ value: item.id, label: item.title }))}
          allowDeselect={false}
          {...form.getInputProps('sourceId')}
        />
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
          <List.Item>{t('openDevToolsLocalStorage')}</List.Item>
          <List.Item>
            <Trans
              i18nKey="copyAuthKeyValue"
              components={{ key: <Text span ff="monospace" fz="sm" /> }}
            />
          </List.Item>
          <List.Item>{t('closeWindowWithoutLoggingOut')}</List.Item>
        </List>
        <Textarea
          label={t('authKeyValue')}
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
