import type { ReactNode } from 'react';
import { FolderSimpleIcon } from '@phosphor-icons/react';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import type { MockFolder } from '../../Bookmarks/models';
import FolderEditForm from './FolderEditForm';

type Props = {
  /** Какая папка открыта; null — модалка закрыта. */
  folder: MockFolder | null;
  onClose: () => void;
  /** V2/V3 — «Удалить папку» в ряду с «Сохранить». */
  deleteButton?: ReactNode;
  /** D2 — зона удаления под «Сохранить». */
  deleteZone?: ReactNode;
};

/** Меню у строки нет, поэтому своя папка правится в модалке «Изменить папку» (тон neutral). */
function EditFolderModal({ folder, onClose, deleteButton, deleteZone }: Props) {
  return (
    <ToneModal
      opened={folder !== null}
      onClose={onClose}
      tone={MODAL_TONE.NEUTRAL}
      icon={FolderSimpleIcon}
      title="Изменить папку"
    >
      {folder && (
        <FolderEditForm
          folder={folder}
          onClose={onClose}
          isInModal
          deleteButton={deleteButton}
          deleteZone={deleteZone}
        />
      )}
    </ToneModal>
  );
}

export default EditFolderModal;
