import { Badge, Group, Skeleton, Text } from '@mantine/core';
import { BookOpenIcon } from '@phosphor-icons/react';
import { Trans, useTranslation } from 'react-i18next';
import { VIEW_MODE } from '@tanuki/contracts';
import useTitleCardLayout from '@/entities/title/card/TitleCard/hooks/useTitleCardLayout';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import TextSkeleton from '@/shared/ui/TextSkeleton';

type Props = {
  skeleton: boolean;
  detailed: boolean;
  empty: boolean;
};

function TitleCardExampleMeta({ skeleton, detailed, empty }: Props) {
  const { t } = useTranslation();
  const { viewMode } = useTitleCardLayout();
  const isList = viewMode === VIEW_MODE.LIST;

  if (empty) return null;

  const items = detailed
    ? [
        t('manga'),
        <Text key="year" span inherit ff="monospace">
          2024
        </Text>,
        <Text key="chapters" span inherit ff="monospace">
          {t('countChaptersAbbrev', { count: 120 })}
        </Text>,
      ]
    : [
        skeleton ? (
          <TextSkeleton key="progress" fz="xs" lh="tight" w={100} />
        ) : (
          <Text key="progress" span inherit>
            <Trans
              i18nKey="chapterNumberOfTotalAbbrev"
              values={{ number: 1090, total: 1093 }}
              components={{ mono: <Text span inherit ff="monospace" /> }}
            />
          </Text>
        ),
      ];

  return (
    <Group gap={6} miw={0}>
      {!detailed && (skeleton ? <Skeleton w={20} h={20} /> : <BookOpenIcon size={20} />)}
      {skeleton ? (
        detailed ? (
          <TextSkeleton fz="xs" lh="tight" flex={1} />
        ) : (
          <Group gap={isList ? 6 : 4} wrap="nowrap">
            {items}
          </Group>
        )
      ) : (
        <MidDotGroup
          items={items}
          gap={isList ? 6 : 4}
          separatorProps={{ c: 'dimmed', fz: 'xs', lh: 'tight' }}
          text={{
            c: 'dimmed',
            fz: 'xs',
            lh: 'tight',
            display: 'inline-flex',
            style: { verticalAlign: 'top' },
          }}
        />
      )}
      {isList &&
        detailed &&
        (skeleton ? (
          <Skeleton w={52} h={20} />
        ) : (
          <Badge variant="muted" color="green">
            {t('ongoing')}
          </Badge>
        ))}
    </Group>
  );
}

export default TitleCardExampleMeta;
