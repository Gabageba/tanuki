import type { ReactNode } from 'react';
import { Button, EmptyState, Radio, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { BookmarkFolderCopy } from '@tanuki/contracts';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import FolderRadioCard from '@/features/bookmark/FolderRadioCard';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import BookmarkFolderOptionsSkeleton from './BookmarkFolderOptionsSkeleton';

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
  loading?: boolean;
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
  loading = false,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const foldersQuery = useBookmarkFolders();
  const { isSkeleton } = useSkeletonTiming(foldersQuery);
  const folders = foldersQuery.data;

  const options = copies.flatMap(({ folderId, sourceIds }) => {
    const folder = folders?.items.find(({ id }) => id === folderId);
    return folder ? [{ folder, sourceIds }] : [];
  });
  const form = useForm<FormValues>({
    initialValues: { folderId: '' },
    validate: {
      folderId: (value) =>
        options.some(({ folder }) => folder.id === (value || options[0]?.folder.id))
          ? null
          : t('chooseAtLeastOneFolder'),
    },
  });
  const selectedFolderId = form.values.folderId || options[0]?.folder.id || '';

  return (
    <ToneModal
      opened={opened}
      onClose={() => {
        if (!isPending) onClose();
      }}
      tone={MODAL_TONE.WARNING}
      icon={BookmarkSimpleIcon}
      title={t('folderForBookmark')}
    >
      <form
        onSubmit={form.onSubmit(() => {
          if (!isPending && !loading && !isSkeleton) onSubmit(selectedFolderId);
        })}
      >
        <Stack gap="md">
          <Stack gap={4}>
            <Text fz="sm">{message}</Text>
            <Text c="dimmed" fz={13}>
              {hint}
            </Text>
          </Stack>
          {loading || isSkeleton ? (
            <BookmarkFolderOptionsSkeleton />
          ) : (
            <Radio.Group
              {...form.getInputProps('folderId')}
              value={selectedFolderId}
              onChange={(value) => {
                if (!isPending) form.setFieldValue('folderId', value);
              }}
            >
              <Stack gap="xs">
                {options.length === 0 && <EmptyState title={t('noDataYet')} size="sm" />}
                {options.map(({ folder, sourceIds }) => (
                  <FolderRadioCard
                    key={folder.id}
                    folder={folder}
                    isChecked={selectedFolderId === folder.id}
                    description={t('liesOnSource', {
                      source: sourceIds.map(getCatalogSourceTitle).join(', '),
                    })}
                  />
                ))}
              </Stack>
            </Radio.Group>
          )}
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              leftSection={submitIcon}
              loading={isPending}
              disabled={loading || isSkeleton}
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
