import { EmptyState, Stack } from '@mantine/core';
import { generatePath } from 'react-router';
import { useTranslation } from 'react-i18next';
import SourceSelectOption from './SourceSelectOption';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import AllElementsIcon from './AllElementsIcon';
import type { ActiveSelection } from '../models';
import { ACTIVE_SELECTION_KINDS } from '../models';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  filteredSources: Source[];
  activeSelection: ActiveSelection;
  onClose: () => void;
};

function SourceSelectOptionsList({ activeSelection, filteredSources, onClose }: Props) {
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
      {filteredSources.length === 0 && <EmptyState size="xs" />}
    </Stack>
  );
}

export default SourceSelectOptionsList;
