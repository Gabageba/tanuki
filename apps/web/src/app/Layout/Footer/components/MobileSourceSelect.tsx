import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import MobileNavigationButton from './MobileNavigationButton';
import SourceSelectMenu from '../../components/SourceSelectMenu';
import useSources from '@/entities/source/hooks/useSources';
import useGetActiveSelection from '../../hooks/useGetActiveSelection';
import MobileNavigationDrawer from './MobileNavigationDrawer';

type Props = {
  isActive: boolean;
  isOpened: boolean;
  setIsOpened: Dispatch<SetStateAction<boolean>>;
};

function MobileSourceSelect({ isActive, setIsOpened, isOpened }: Props) {
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
      <MobileNavigationDrawer
        opened={isOpened}
        onClose={() => setIsOpened(false)}
        title="Источники"
      >
        <SourceSelectMenu
          sources={sources}
          activeSelection={activeSelection}
          query={query}
          setQuery={setQuery}
          handleOpenedChange={handleOpenedChange}
          fillHeight
        />
      </MobileNavigationDrawer>
    </>
  );
}

export default MobileSourceSelect;
