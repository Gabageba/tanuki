import { Alert, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from '@phosphor-icons/react';
import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import { toOptionalQuery } from '@/shared/ui/QueryBlock/lib';
import type useProfileQueries from '../../hooks/useProfileQueries';
import ProfileSourceAccountsSkeleton from './ProfileSourceAccountsSkeleton';
import SourceFamiliesGrid from './SourceFamiliesGrid';

function ProfileSourceAccounts() {
  const { t } = useTranslation();
  const { sources: sourcesQuery, sourceAccounts } =
    PageLayout.useQueries<typeof useProfileQueries>();

  // Без аккаунтов семейства всё равно показываются — просто без привязанных входов.
  return (
    <QueryBlock
      query={[sourcesQuery, toOptionalQuery(sourceAccounts)]}
      skeleton={<ProfileSourceAccountsSkeleton />}
    >
      {([sourcesData, accounts]) => (
        <Stack mt="lg" gap="lg">
          <Text c="dimmed">{t('sourcesWithLoginOpenViaYourAccount')}</Text>
          {accounts && !accounts.isLinkingAvailable && (
            <Alert color="orange" icon={<InfoIcon />} variant="muted">
              {t('accountLinkingNotConfigured')}
            </Alert>
          )}
          <SourceFamiliesGrid
            sourcesData={sourcesData}
            accounts={accounts?.items ?? []}
            isLinkingAvailable={accounts?.isLinkingAvailable ?? false}
          />
        </Stack>
      )}
    </QueryBlock>
  );
}

export default ProfileSourceAccounts;
