import { Alert, Center, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from '@phosphor-icons/react';
import useSources from '@/entities/source/hooks/useSources';
import GroupedList from '@/shared/ui/GroupedList';
import useSourceAccounts from './hooks/useSourceAccounts';
import { groupSourcesByAccount } from './lib';
import SourceFamilySection from './SourceFamilySection';
import SourceToggleRow from './SourceToggleRow';

function SettingsSources() {
  const { t } = useTranslation();
  const { data, isPending } = useSources();
  const { data: accounts } = useSourceAccounts();

  if (isPending) {
    return (
      <Center mt="lg">
        <Loader />
      </Center>
    );
  }

  const { accountGroups, withoutLogin } = groupSourcesByAccount(data);
  const isLinkingAvailable = accounts?.isLinkingAvailable ?? false;

  return (
    <Stack mt="lg" gap="lg">
      <Stack gap={4}>
        <Text c="dimmed">{t('sourcesWithLoginOpenViaYourAccount')}</Text>
        <Text c="dimmed">{t('disabledSourcesAreHidden')}</Text>
      </Stack>
      {accounts && !isLinkingAvailable && (
        <Alert color="orange" icon={<InfoIcon />} variant="muted">
          {t('accountLinkingNotConfigured')}
        </Alert>
      )}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Stack gap="lg">
          {accountGroups.map(({ key, title, family, sources }) => (
            <SourceFamilySection
              key={key}
              title={title}
              family={family}
              sources={sources}
              accounts={accounts?.items ?? []}
              isLinkingAvailable={isLinkingAvailable}
            />
          ))}
        </Stack>
        <GroupedList label={t('withoutLogin')}>
          {withoutLogin.map((source) => (
            <SourceToggleRow key={source.id} source={source} />
          ))}
        </GroupedList>
      </SimpleGrid>
    </Stack>
  );
}

export default SettingsSources;
