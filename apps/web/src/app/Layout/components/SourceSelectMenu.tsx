import { ScrollArea, Stack, TextInput } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { Dispatch } from 'react';
import type { ActiveSelection } from '../models';
import { getFilteredSources } from '../models';
import type { SourcesResponse } from '@tanuki/contracts';
import SourceSelectOptionsList from './SourceSelectOptionsList';

type Props = {
  query: string;
  activeSelection: ActiveSelection;
  setQuery: Dispatch<React.SetStateAction<string>>;
  handleOpenedChange: (isOpened: boolean) => void;
  sources?: SourcesResponse;
  fillHeight?: boolean;
};

function SourceSelectMenu({
  query,
  setQuery,
  handleOpenedChange,
  sources,
  activeSelection,
  fillHeight,
}: Props) {
  const filteredSources = getFilteredSources(sources, query);

  return (
    <Stack gap="xs" h={fillHeight ? '100%' : undefined}>
      <TextInput
        leftSection={<MagnifyingGlassIcon />}
        placeholder="Найти источник"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      {fillHeight ? (
        <ScrollArea type="auto" flex={1} mih={0} offsetScrollbars="y">
          <SourceSelectOptionsList
            onClose={() => handleOpenedChange(false)}
            filteredSources={filteredSources}
            activeSelection={activeSelection}
          />
        </ScrollArea>
      ) : (
        <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars="y">
          <SourceSelectOptionsList
            onClose={() => handleOpenedChange(false)}
            filteredSources={filteredSources}
            activeSelection={activeSelection}
          />
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}

export default SourceSelectMenu;
