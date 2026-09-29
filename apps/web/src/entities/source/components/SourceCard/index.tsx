import { Card, Group, Overlay, Stack, Text } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SOURCE_ACCESS, type Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SourceTitle from '@/entities/source/components/SourceTitle';
import SourceStatusBadge from '../SourceStatusBadge';
import { getFlagByLocale, getSourceAccessLabel } from '../../lib';
import styles from './SourceCard.module.scss';

type Props = {
  source: Source;
};
function SourceCard({ source }: Props) {
  const { t } = useTranslation();

  const isSourceAvailable = source.access === SOURCE_ACCESS.AVAILABLE;

  return (
    <Card
      component={Link}
      to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
      className={isSourceAvailable ? styles.card : undefined}
      withBorder
      pos="relative"
    >
      {!isSourceAvailable && (
        <Overlay
          color="var(--mantine-color-body)"
          backgroundOpacity={0.8}
          blur={4}
          radius="sm"
          center
        >
          <Stack gap={4} align="center" c="terracotta">
            <LockSimpleIcon size={24} aria-label={getSourceAccessLabel(source.access, t)} />
            <Text lh={1}>{getSourceAccessLabel(source.access, t)}</Text>
          </Stack>
        </Overlay>
      )}
      <Group gap="xs" wrap="nowrap">
        <SourceTitle source={source} />
        <Stack gap={8} justify="end" flex="none">
          <Group gap={4} justify="flex-end">
            <Text fz={20} lh={1}>
              {getFlagByLocale(source.locale)}
            </Text>
            <Text ff="monospace" tt="uppercase" lts={1}>
              {source.locale}
            </Text>
          </Group>

          <SourceStatusBadge source={source} visibleFrom="xxs" justify="flex-end" />
        </Stack>
      </Group>
    </Card>
  );
}

export default SourceCard;
