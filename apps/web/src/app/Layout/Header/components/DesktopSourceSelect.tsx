import { Button, Popover } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import useSources from '@/entities/source/hooks/useSources';
import { getEnabledSources } from '@/entities/source/lib';
import SourceSelectMenu from '../../components/SourceSelectMenu';
import useGetActiveSelection from '../../hooks/useGetActiveSelection';
import styles from './../Header.module.scss';

function DesktopSourceSelect() {
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState('');

  const { data: sources } = useSources();

  const activeSelection = useGetActiveSelection(sources);

  const handleOpenedChange = (isOpened: boolean) => {
    setOpened(isOpened);
    if (!isOpened) {
      setQuery('');
    }
  };

  return (
    <Popover
      opened={opened}
      onChange={handleOpenedChange}
      position="bottom-start"
      width={320}
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <Button
          data-open={opened || undefined}
          onClick={() => handleOpenedChange(!opened)}
          variant="default"
          fz={16}
          className={styles.sourceSelectButton}
          leftSection={activeSelection.icon}
          rightSection={opened ? <CaretUpIcon /> : <CaretDownIcon />}
          visibleFrom="md"
        >
          {activeSelection.title}
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <SourceSelectMenu
          activeSelection={activeSelection}
          sources={getEnabledSources(sources)}
          query={query}
          setQuery={setQuery}
          handleOpenedChange={handleOpenedChange}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

export default DesktopSourceSelect;
