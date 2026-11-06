import { Badge, Group, Skeleton, Text } from '@mantine/core';
import { StarIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { TITLE } from '../titles';

type Props = { skeleton: boolean; detailed: boolean };

function TitleCardExampleFooter({ skeleton, detailed }: Props) {
  const { t } = useTranslation();

  if (!detailed) {
    return skeleton ? (
      <TextSkeleton fz="xs" lh="tight" w={56} />
    ) : (
      <Text fz="xs" c="dimmed" lh="tight">
        {t('manga')}
      </Text>
    );
  }

  return (
    <Group gap={8} wrap="nowrap">
      <Group gap={6} flex={1} miw={0} wrap="nowrap" style={{ overflow: 'hidden' }}>
        {skeleton ? (
          <Skeleton w={160} h={20} />
        ) : (
          TITLE.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="muted" color="gray">
              {tag.title}
            </Badge>
          ))
        )}
      </Group>
      {skeleton ? (
        <Skeleton h={16} w={48} />
      ) : (
        <Group gap={4} wrap="nowrap">
          <StarIcon size={16} />
          <Text ff="monospace" lh="tight">
            9.4
          </Text>
        </Group>
      )}
    </Group>
  );
}

export default TitleCardExampleFooter;
