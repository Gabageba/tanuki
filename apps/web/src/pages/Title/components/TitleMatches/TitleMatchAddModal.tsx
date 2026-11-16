import { Button, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { LinkIcon, PlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import { parseTitleLink } from '../../lib';

type Props = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (targetId: string) => Promise<void>;
  isPending: boolean;
};

function TitleMatchAddModal({ opened, onClose, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: { link: '' },
    validate: { link: (value) => (parseTitleLink(value) ? null : t('notATitleLink')) },
  });

  const handleClose = () => {
    if (isPending) return;
    form.reset();
    onClose();
  };

  const handleSubmit = form.onSubmit(async ({ link }) => {
    const targetId = parseTitleLink(link);
    if (targetId) await onSubmit(targetId);
  });

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={LinkIcon}
      opened={opened}
      onClose={handleClose}
      title={t('addTitleManually')}
      onExitTransitionEnd={() => {
        if (!isPending) form.reset();
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Text c="dimmed" fz={13}>
            {t('pasteLinkFromOtherSource')}
          </Text>
          <TextInput
            {...form.getInputProps('link')}
            placeholder="/title/desume:eyJpZCI6..."
            aria-label={t('addTitleManually')}
            leftSection={<LinkIcon />}
            disabled={isPending}
            data-autofocus
          />
          <Button type="submit" leftSection={<PlusIcon />} loading={isPending}>
            {t('add')}
          </Button>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default TitleMatchAddModal;
