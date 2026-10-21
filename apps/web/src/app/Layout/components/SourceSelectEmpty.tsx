import { EmptyState } from '@mantine/core';
import { EmptyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import SourceSearchEmpty from './SourceSearchEmpty';

type Props = {
  /** `undefined` — список источников ещё не пришёл, показывать нечего. */
  hasSources: boolean | undefined;
  foundCount: number;
  onResetQuery: () => void;
};

/** Пустой список источников: либо их нет совсем, либо их не нашёл поиск. */
function SourceSelectEmpty({ hasSources, foundCount, onResetQuery }: Props) {
  const { t } = useTranslation();

  if (hasSources === undefined) {
    return null;
  }

  if (!hasSources) {
    return (
      <EmptyState
        size="sm"
        title={t('noEnabledSources')}
        description={t('enableNeededSourcesInSettings')}
        icon={<EmptyIcon />}
      />
    );
  }

  if (foundCount === 0) {
    return <SourceSearchEmpty onReset={onResetQuery} />;
  }

  return null;
}

export default SourceSelectEmpty;
