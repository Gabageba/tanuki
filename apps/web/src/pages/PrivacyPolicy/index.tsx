import { Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Title order={2} fz={20}>
        {t('dataProcessingPolicy')}
      </Title>
      <Text size="sm" c="dimmed">
        {t('documentTextComingSoon')}
      </Text>
    </Stack>
  );
}

export default PrivacyPolicy;
