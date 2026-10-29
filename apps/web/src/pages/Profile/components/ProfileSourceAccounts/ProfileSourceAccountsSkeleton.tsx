import { Group, Skeleton, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import GroupedList from '@/shared/ui/GroupedList';
import TextSkeleton from '@/shared/ui/TextSkeleton';

/** Семейств с входом и источников в них обычно столько — заглушки повторяют этот расклад. */
const SKELETON_FAMILIES = 2;
const SKELETON_ROWS = 3;

/** Загрузка вкладки «Аккаунты источников»: пояснение и блоки семейств, названия — плашками. */
function ProfileSourceAccountsSkeleton() {
  const { t } = useTranslation();

  return (
    <Stack mt="lg" gap="lg">
      <Text c="dimmed">{t('sourcesWithLoginOpenViaYourAccount')}</Text>
      <Stack gap="lg">
        {Array.from({ length: SKELETON_FAMILIES }, (_, family) => (
          <GroupedList
            key={family}
            label={<TextSkeleton fz={12} lh="tight" w={120} />}
            loading
            skeletonRows={SKELETON_ROWS}
            aside={
              <Group
                gap="xs"
                justify="space-between"
                wrap="nowrap"
                align="flex-start"
                px="md"
                py="xs"
              >
                <Group gap="xs" wrap="nowrap" align="flex-start" flex={1} miw={0}>
                  <Skeleton w={24} h={24} radius="sm" flex="none" />
                  <Stack gap={4} flex={1} miw={0}>
                    <TextSkeleton fz="sm" lh="tight" w="70%" />
                    <TextSkeleton fz="xs" lh="tight" w="90%" />
                  </Stack>
                </Group>
                <Skeleton w={100} h={30} radius="sm" flex="none" />
              </Group>
            }
          />
        ))}
      </Stack>
    </Stack>
  );
}

export default ProfileSourceAccountsSkeleton;
