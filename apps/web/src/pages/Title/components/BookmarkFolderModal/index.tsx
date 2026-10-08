import type { ReactNode } from 'react';
import { Button, Radio, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { BookmarkFolderCopy } from '@tanuki/contracts';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import FolderRadioCard from '@/features/bookmark/FolderRadioCard';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  opened: boolean;
  onClose: () => void;
  /** Разошедшиеся папки копий тайтла, свежая первой. */
  copies: BookmarkFolderCopy[];
  /** Что произойдёт — главная фраза. */
  message: string;
  /** Пояснение под ней. */
  hint: string;
  submitLabel: string;
  submitIcon: ReactNode;
  isPending: boolean;
  onSubmit: (folderId: string) => void;
};

type FormValues = {
  folderId: string;
};

/**
 * «Папка для закладки» (M1d, тон `warning`): копии тайтла лежат в разных папках, а должны в одной.
 * Ничего не теряется, но закладка переезжает. Открывается при подтверждении связи и при
 * следующем открытии тайтла, если связь подтвердил кто-то другой.
 */
function BookmarkFolderModal({
  opened,
  onClose,
  copies,
  message,
  hint,
  submitLabel,
  submitIcon,
  isPending,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const { data: folders } = useBookmarkFolders();
  const form = useForm<FormValues>({ initialValues: { folderId: copies[0]?.folderId ?? '' } });

  const options = copies.flatMap(({ folderId, sourceIds }) => {
    const folder = folders?.items.find(({ id }) => id === folderId);
    return folder ? [{ folder, sourceIds }] : [];
  });

  return (
    <ToneModal
      opened={opened}
      onClose={onClose}
      tone={MODAL_TONE.WARNING}
      icon={BookmarkSimpleIcon}
      title={t('folderForBookmark')}
    >
      <form onSubmit={form.onSubmit(({ folderId }) => onSubmit(folderId))}>
        <Stack gap="md">
          <Stack gap={4}>
            <Text fz="sm">{message}</Text>
            <Text c="dimmed" fz={13}>
              {hint}
            </Text>
          </Stack>
          <Radio.Group {...form.getInputProps('folderId')}>
            <Stack gap="xs">
              {options.map(({ folder, sourceIds }) => (
                <FolderRadioCard
                  key={folder.id}
                  folder={folder}
                  isChecked={form.getValues().folderId === folder.id}
                  description={t('liesOnSource', {
                    source: sourceIds.map(getCatalogSourceTitle).join(', '),
                  })}
                />
              ))}
            </Stack>
          </Radio.Group>
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              color={STATUS_DEGRADED_COLOR}
              leftSection={submitIcon}
              loading={isPending}
            >
              {submitLabel}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default BookmarkFolderModal;
