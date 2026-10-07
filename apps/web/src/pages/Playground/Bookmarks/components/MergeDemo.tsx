import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import type { MergeVariant } from '../models';
import MergeFolderModal from './MergeFolderModal';
import ModalTrigger from './ModalTrigger';

type Props = {
  variant: MergeVariant;
};

/** Модалка склейки открывается кнопкой песочницы. */
function MergeDemo({ variant }: Props) {
  return (
    <ModalTrigger
      label="Подтвердить связь"
      icon={<BookmarkSimpleIcon />}
      renderModal={(onClose) => <MergeFolderModal opened onClose={onClose} variant={variant} />}
    />
  );
}

export default MergeDemo;
