import { Alert, SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from '@phosphor-icons/react';
import SourceLoginBadgeLegend from '@/entities/source/components/SourceLoginBadge/SourceLoginBadgeLegend';
import useSources from '@/entities/source/hooks/useSources';
import { getPresentSourceLoginMarks } from '@/entities/source/lib';
import useSourceAccounts from './hooks/useSourceAccounts';
import { groupSourcesByAccount } from './lib';
import ProfileSourceAccountsSkeleton from './ProfileSourceAccountsSkeleton';
import SourceFamilySection from './SourceFamilySection';

function ProfileSourceAccounts() {
  const { t } = useTranslation();
  const { data: sources, isPending: isSourcesPending } = useSources();
  const { data: accounts, isPending: isAccountsPending } = useSourceAccounts();

  if (isSourcesPending) {
    return <ProfileSourceAccountsSkeleton />;
  }

  const isLinkingAvailable = accounts?.isLinkingAvailable ?? false;
  const accountGroups = groupSourcesByAccount(sources);

  return (
    <Stack mt="lg" gap="lg">
      <Text c="dimmed">{t('sourcesWithLoginOpenViaYourAccount')}</Text>
      {accounts && !isLinkingAvailable && (
        <Alert color="orange" icon={<InfoIcon />} variant="muted">
          {t('accountLinkingNotConfigured')}
        </Alert>
      )}
      <Stack gap={6}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {accountGroups.map(({ key, title, family, sources }) => (
            <SourceFamilySection
              key={key}
              title={title}
              family={family}
              sources={sources}
              accounts={accounts?.items ?? []}
              isLinkingAvailable={isLinkingAvailable}
              isAccountsPending={isAccountsPending}
            />
          ))}
        </SimpleGrid>
        {/* Пока семейства в скелетоне, пояснять нечего. */}
        {!isAccountsPending && (
          <SourceLoginBadgeLegend
            marks={getPresentSourceLoginMarks(accountGroups.flatMap((group) => group.sources))}
          />
        )}
      </Stack>
    </Stack>
  );
}

export default ProfileSourceAccounts;
