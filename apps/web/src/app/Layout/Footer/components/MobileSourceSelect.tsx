import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { DRAWER_POSITION, SHEET_HEIGHT } from '@/shared/ui/ResponsiveDrawer/models';
import MobileNavigationButton from './MobileNavigationButton';
import SourceSelectMenu from '../../components/SourceSelectMenu';
import useSources from '@/entities/source/hooks/useSources';
import { getEnabledSources } from '@/entities/source/lib';
import useGetActiveSelection from '../../hooks/useGetActiveSelection';

type Props = {
  isActive: boolean;
  isOpened: boolean;
  setIsOpened: Dispatch<SetStateAction<boolean>>;
};

function MobileSourceSelect({ isActive, setIsOpened, isOpened }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const { data: sources } = useSources();

  const activeSelection = useGetActiveSelection(sources);

  const handleOpenedChange = (isOpened: boolean) => {
    setIsOpened(isOpened);
    if (!isOpened) {
      setQuery('');
    }
  };

  return (
    <>
      <MobileNavigationButton
        leftSection={activeSelection.icon}
        rightSection={<CaretUpDownIcon size={14} />}
        title={activeSelection.title}
        isActive={isActive}
        onClick={() => setIsOpened((prev) => !prev)}
      />
      <ResponsiveDrawer
        opened={isOpened}
        onClose={() => setIsOpened(false)}
        side={DRAWER_POSITION.LEFT}
        height={SHEET_HEIGHT.TALL}
        title={t('sources')}
      >
        <SourceSelectMenu
          sources={getEnabledSources(sources)}
          activeSelection={activeSelection}
          query={query}
          setQuery={setQuery}
          handleOpenedChange={handleOpenedChange}
          fillHeight
        />
      </ResponsiveDrawer>
    </>
  );
}

export default MobileSourceSelect;
