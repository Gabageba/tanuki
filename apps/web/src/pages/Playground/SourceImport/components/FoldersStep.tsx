import { CloudArrowDownIcon } from '@phosphor-icons/react';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';
import { SOURCE_TITLE, type FoldersView, type SiteFolder } from '../models';
import FoldersForm from './FoldersForm';
import SourceBookmarksEmpty from './SourceBookmarksEmpty';

type Props = {
  folders: SiteFolder[];
  view: FoldersView;
  isPhone?: boolean;
};

/** Шаг «Папки» в рамке модалки; «Назад» в заголовке — к выбору источника. */
function FoldersStep({ folders, view, isPhone = false }: Props) {
  return (
    <ModalFrame
      title={`Закладки на ${SOURCE_TITLE}`}
      tone={MODAL_TONE.NEUTRAL}
      icon={CloudArrowDownIcon}
      isPhone={isPhone}
      onBack={() => {}}
    >
      {folders.length === 0 ? (
        <SourceBookmarksEmpty />
      ) : (
        <FoldersForm folders={folders} view={view} isPhone={isPhone} />
      )}
    </ModalFrame>
  );
}

export default FoldersStep;
