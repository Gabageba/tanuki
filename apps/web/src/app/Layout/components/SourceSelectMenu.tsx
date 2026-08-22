import { EmptyState, ScrollArea, Stack, TextInput } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { generatePath } from 'react-router';
import type { Dispatch } from 'react';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { ActiveSelection } from '../models';
import { ACTIVE_SELECTION_KINDS, getFilteredSources } from '../models';
import SourceSelectOption from './SourceSelectOption';
import AllElementsIcon from './AllElementsIcon';
import type { SourcesResponse } from '@tanuki/contracts';

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

  const optionsList = (
    <Stack gap="md">
      <Stack gap={4}>
        <SourceSelectOption
          to={ROUTE_PATHS.SOURCES}
          label={'Все источники'}
          onClick={() => handleOpenedChange(false)}
          leftSection={<AllElementsIcon size={22} />}
          isActive={activeSelection.kind === ACTIVE_SELECTION_KINDS.ALL}
        />
        {filteredSources.map(({ id, title }) => (
          <SourceSelectOption
            key={id}
            to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: id })}
            onClick={() => handleOpenedChange(false)}
            leftSection={<SourceIcon id={id} title={title} size={22} bdrs="sm" />}
            label={title}
            isActive={
              activeSelection.kind === ACTIVE_SELECTION_KINDS.SOURCE &&
              activeSelection.sourceId === id
            }
          />
        ))}
      </Stack>
      {filteredSources.length === 0 && <EmptyState size="xs" />}
    </Stack>
  );

  return (
    <Stack gap="xs" h={fillHeight ? '100%' : undefined}>
      <TextInput
        leftSection={<MagnifyingGlassIcon />}
        placeholder="Найти источник"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      {fillHeight ? (
        <ScrollArea type="auto" offsetScrollbars="y" style={{ flex: 1, minHeight: 0 }}>
          {optionsList}
        </ScrollArea>
      ) : (
        <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars="y">
          {optionsList}
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}

export default SourceSelectMenu;
