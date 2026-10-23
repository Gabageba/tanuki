import { useState } from 'react';
import { CloudArrowDownIcon } from '@phosphor-icons/react';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';
import { SOURCE_TITLE, type SiteFolder, type TitlesConfig } from '../models';
import SourceBookmarksEmpty from './SourceBookmarksEmpty';
import TitlesForm from './TitlesForm';

type Props = {
  folders: SiteFolder[];
  config: TitlesConfig;
  isPhone?: boolean;
};

/** Шаг «Тайтлы» в рамке модалки. «Назад» в заголовке — к источнику, а в L4 из открытой папки — к
 *  обзору папок. */
function TitlesStep({ folders, config, isPhone = false }: Props) {
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const openFolder = folders.find((folder) => folder.id === openFolderId) ?? null;

  return (
    <ModalFrame
      title={openFolder ? openFolder.name : `Закладки на ${SOURCE_TITLE}`}
      tone={MODAL_TONE.NEUTRAL}
      icon={CloudArrowDownIcon}
      isPhone={isPhone}
      onBack={() => setOpenFolderId(null)}
    >
      {folders.length === 0 ? (
        <SourceBookmarksEmpty />
      ) : (
        <TitlesForm
          folders={folders}
          config={config}
          isPhone={isPhone}
          openFolder={openFolder}
          onOpenFolder={(folder) => setOpenFolderId(folder.id)}
        />
      )}
    </ModalFrame>
  );
}

export default TitlesStep;
