import { EmptyState } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** `/search` без запроса — попадают сюда лишь по адресу руками; недавние живут в шапке. */
function SearchInvite() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('searchByTitleImperative')}
      description={t('typeTitleInSearchBar')}
      icon={<MagnifyingGlassIcon />}
    />
  );
}

export default SearchInvite;
