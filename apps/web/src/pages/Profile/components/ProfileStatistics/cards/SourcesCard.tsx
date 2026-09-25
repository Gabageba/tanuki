import { Box, Divider, Group, Stack, Text } from '@mantine/core';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import ProfileStatisticCard from './ProfileStatisticCard';
import { NEUTRAL_BAR_COLOR } from '@/shared/lib/palette';
import { SOURCES_MOCK } from './mocks';

function SourcesCard() {
  const { t } = useTranslation();

  const total = SOURCES_MOCK.reduce((sum, { chapters }) => sum + chapters, 0);

  return (
    <ProfileStatisticCard label={t('sources')} extra={t('whereReadFrom')}>
      <Stack gap="sm">
        {SOURCES_MOCK.map(({ id, title, chapters }, index) => (
          <Fragment key={id}>
            {index > 0 && <Divider />}
            <Group justify="space-between" wrap="nowrap" align="flex-start" gap={8}>
              <Group gap="sm" wrap="nowrap" align="flex-start" miw={0}>
                <Box
                  w={8}
                  h={8}
                  mt={8}
                  flex="none"
                  bdrs="50%"
                  bg={index === 0 ? 'var(--mantine-primary-color-filled)' : NEUTRAL_BAR_COLOR}
                />
                <Text truncate>{title}</Text>
              </Group>
              <Group gap={4}>
                <Text ff="monospace">{t('countChaptersAbbrev', { count: chapters })}</Text>
                <Text ff="monospace" c="dimmed">
                  ({Math.round((chapters / total) * 100)}%)
                </Text>
              </Group>
            </Group>
          </Fragment>
        ))}
      </Stack>
    </ProfileStatisticCard>
  );
}

export default SourcesCard;
