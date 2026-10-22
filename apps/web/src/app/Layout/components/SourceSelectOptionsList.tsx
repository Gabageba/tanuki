import { Stack } from '@mantine/core';
import { generatePath } from 'react-router';
import { useTranslation } from 'react-i18next';
import SourceSelectOption from './SourceSelectOption';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import AllElementsIcon from './AllElementsIcon';
import type { ActiveSelection } from '../models';
import { ACTIVE_SELECTION_KINDS } from '../models';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import SourceSelectEmpty from './SourceSelectEmpty';

type Props = {
  filteredSources: Source[];
  /** Включён ли хоть один источник — иначе пусто не из-за запроса; `undefined` — список ещё не пришёл. */
  hasSources: boolean | undefined;
  activeSelection: ActiveSelection;
  onClose: () => void;
  onResetQuery: () => void;
};

function SourceSelectOptionsList({
  activeSelection,
  filteredSources,
  hasSources,
  onClose,
  onResetQuery,
}: Props) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <SourceSelectOption
          to={ROUTE_PATHS.SOURCES}
          label={t('allSources')}
          onClick={onClose}
          leftSection={<AllElementsIcon size={22} />}
          isActive={activeSelection.kind === ACTIVE_SELECTION_KINDS.ALL}
        />
        {filteredSources.map(({ id, title }) => (
          <SourceSelectOption
            key={id}
            to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: id })}
            onClick={onClose}
            leftSection={<SourceIcon id={id} title={title} size={22} bdrs="sm" />}
            label={title}
            isActive={
              activeSelection.kind === ACTIVE_SELECTION_KINDS.SOURCE &&
              activeSelection.sourceId === id
            }
          />
        ))}
      </Stack>
      <SourceSelectEmpty
        hasSources={hasSources}
        foundCount={filteredSources.length}
        onResetQuery={onResetQuery}
      />
    </Stack>
  );
}

export default SourceSelectOptionsList;
