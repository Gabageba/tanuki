import { ScrollArea, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Dispatch } from 'react';
import type { ActiveSelection } from '../models';
import { getFilteredSources } from '../models';
import { flattenSources } from '@/entities/source/lib';
import type { SourcesResponse } from '@tanuki/contracts';
import SourceSelectOptionsList from './SourceSelectOptionsList';
import SearchInput from '@/shared/ui/SearchInput';

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
  const { t } = useTranslation();
  const filteredSources = getFilteredSources(sources, query);
  // Пока список не пришёл (загрузка или ошибка), неизвестно, есть ли источники вообще.
  const hasSources = sources && flattenSources(sources).length > 0;

  return (
    <Stack gap="xs" h={fillHeight ? '100%' : undefined}>
      <SearchInput allowClear placeholder={t('findSource')} value={query} onChange={setQuery} />
      {fillHeight ? (
        <ScrollArea type="auto" flex={1} mih={0} offsetScrollbars="y">
          <SourceSelectOptionsList
            onClose={() => handleOpenedChange(false)}
            filteredSources={filteredSources}
            hasSources={hasSources}
            activeSelection={activeSelection}
            onResetQuery={() => setQuery('')}
          />
        </ScrollArea>
      ) : (
        <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars="y">
          <SourceSelectOptionsList
            onClose={() => handleOpenedChange(false)}
            filteredSources={filteredSources}
            hasSources={hasSources}
            activeSelection={activeSelection}
            onResetQuery={() => setQuery('')}
          />
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}

export default SourceSelectMenu;
