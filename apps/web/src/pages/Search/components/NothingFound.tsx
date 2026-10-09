import { Button, EmptyState } from '@mantine/core';
import { FunnelIcon, FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  withFilters: boolean;
  onReset: () => void;
};

/** Ни один источник ничего не нашёл; при выбранных фильтрах — «Сбросить фильтры». */
function NothingFound({ withFilters, onReset }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('nothingFound')}
      description={t('tryOtherSpellingOrOriginalTitle')}
      icon={withFilters ? <FunnelIcon /> : <MagnifyingGlassIcon />}
    >
      {withFilters && (
        <EmptyState.Actions>
          <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
            {t('resetFilters')}
          </Button>
        </EmptyState.Actions>
      )}
    </EmptyState>
  );
}

export default NothingFound;
