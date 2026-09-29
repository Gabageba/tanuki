import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '@mantine/core';
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
      <Drawer opened={isOpened} onClose={() => setIsOpened(false)} title={t('sources')}>
        <SourceSelectMenu
          sources={getEnabledSources(sources)}
          activeSelection={activeSelection}
          query={query}
          setQuery={setQuery}
          handleOpenedChange={handleOpenedChange}
          fillHeight
        />
      </Drawer>
    </>
  );
}

export default MobileSourceSelect;
