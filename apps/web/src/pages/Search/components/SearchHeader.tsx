import { Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import type { FoundGroup } from '../models';
import FoundOnRow from './FoundOnRow';

type Props = {
  query: string;
  found: FoundGroup[];
};

/** «Результаты по «…»», под ним — чипы источников, где что-то нашлось. */
function SearchHeader({ query, found }: Props) {
  const { t } = useTranslation();

  return (
    <PageLayout.Header>
      <Stack gap="sm">
        <Title order={2}>{t('resultsFor', { query })}</Title>
        <FoundOnRow found={found} />
      </Stack>
    </PageLayout.Header>
  );
}

export default SearchHeader;
