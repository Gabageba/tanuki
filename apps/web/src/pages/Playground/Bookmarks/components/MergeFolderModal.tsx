import { Button, Radio, Select, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { BookmarkSimpleIcon, LinkSimpleIcon } from '@phosphor-icons/react';
import { catalogEntryFor, SOURCE_ID } from '@tanuki/contracts';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import { BUILT_IN_STYLE, MERGE_VARIANT, type MergeVariant } from '../models';
import FolderGlyph from './FolderGlyph';
import MergeFolderCard from './MergeFolderCard';

type Props = {
  opened: boolean;
  onClose: () => void;
  variant: MergeVariant;
};

const FOLDERS = MOCK_FOLDERS.map((folder) => resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC));

/** Две копии тайтла и папка каждой — как при подтверждении связи «Ван Пис» MangaLib ↔ Remanga. */
const COPIES = [
  { sourceTitle: catalogEntryFor(SOURCE_ID.MANGALIB).title, folderId: 'reading' },
  { sourceTitle: catalogEntryFor(SOURCE_ID.REMANGA).title, folderId: 'favorites' },
].flatMap(({ sourceTitle, folderId }) => {
  const folder = FOLDERS.find(({ id }) => id === folderId);
  return folder ? [{ sourceTitle, folder }] : [];
});

/** Папки — карточками Radio.Card? Исчерпывающий switch: новый вариант без ответа не соберётся. */
const isRadioCardVariant = (variant: MergeVariant) => {
  switch (variant) {
    case MERGE_VARIANT.RADIO_CARDS:
    case MERGE_VARIANT.RADIO_CARDS_INHERIT:
    case MERGE_VARIANT.RADIO_CARDS_BORDER:
    case MERGE_VARIANT.RADIO_CARDS_PLATE:
    case MERGE_VARIANT.RADIO_CARDS_FOLDER_TINT:
      return true;
    case MERGE_VARIANT.SELECT:
    case MERGE_VARIANT.BUTTONS:
      return false;
  }
};

/** Подтверждение связи, когда обе копии в закладках, но в разных папках. Тон `warning`:
 *  ничего не теряется, но одна закладка переезжает. */
function MergeFolderModal({ opened, onClose, variant }: Props) {
  const form = useForm({ initialValues: { folderId: COPIES[0]?.folder.id ?? '' } });
  const selected = FOLDERS.find(({ id }) => id === form.getValues().folderId);

  return (
    <ToneModal
      opened={opened}
      onClose={onClose}
      tone={MODAL_TONE.WARNING}
      icon={BookmarkSimpleIcon}
      title="Папка для закладки"
    >
      <form onSubmit={form.onSubmit(onClose)}>
        <Stack gap="md">
          <Stack gap={4}>
            <Text fz="sm">Оба тайтла в закладках — в какой папке оставить?</Text>
            <Text c="dimmed" fz={13}>
              После связи это будет одна закладка на оба источника.
            </Text>
          </Stack>
          {isRadioCardVariant(variant) && (
            <Radio.Group {...form.getInputProps('folderId')}>
              <Stack gap="xs">
                {COPIES.map(({ sourceTitle, folder }) => (
                  <MergeFolderCard
                    key={folder.id}
                    folder={folder}
                    sourceTitle={sourceTitle}
                    isChecked={form.getValues().folderId === folder.id}
                    variant={variant}
                  />
                ))}
              </Stack>
            </Radio.Group>
          )}
          {variant === MERGE_VARIANT.SELECT && (
            <Select
              aria-label="Папка"
              allowDeselect={false}
              data={COPIES.map(({ folder, sourceTitle }) => ({
                value: folder.id,
                label: `${folder.name} — как на ${sourceTitle}`,
              }))}
              leftSection={selected && <FolderGlyph folder={selected} />}
              {...form.getInputProps('folderId')}
            />
          )}
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            {variant === MERGE_VARIANT.BUTTONS ? (
              COPIES.map(({ folder }) => (
                <Button
                  key={folder.id}
                  type="submit"
                  variant="default"
                  leftSection={<FolderGlyph folder={folder} />}
                  onClick={() => form.setFieldValue('folderId', folder.id)}
                >
                  В «{folder.name}»
                </Button>
              ))
            ) : (
              <Button type="submit" color="gold" leftSection={<LinkSimpleIcon />}>
                Связать
              </Button>
            )}
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default MergeFolderModal;
