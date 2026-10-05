import { Button, Divider, Drawer, Group, Stack, Text, useMatches } from '@mantine/core';
import { BookOpenIcon } from '@phosphor-icons/react';
import { generatePath, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ProbeSourceButton from './ProbeSourceButton';
import ReasonBlock from './ReasonBlock';
import SourceFields from './SourceFields';

type Props = {
  source: Source | null;
  /** «Проверить сейчас» — только персоналу, как и сама ручка. */
  isStaff: boolean;
  onClose: () => void;
};

/** Карточка источника, устроенная как карточка пользователя: шапка с иконкой, названием и
 *  доменом, поля, под ними причина заголовком к полному тексту ошибки, действия внизу. Справа, на
 *  телефоне — снизу. */
function SourceDrawer({ source, isStaff, onClose }: Props) {
  const { t } = useTranslation();
  const position = useMatches<'bottom' | 'right'>({ base: 'bottom', sm: 'right' });

  return (
    <Drawer
      opened={source !== null}
      onClose={onClose}
      position={position}
      size={position === 'bottom' ? 'auto' : 420}
      title={t('source')}
    >
      {source && (
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <SourceIcon id={source.id} title={source.title} size={48} />
            <Stack gap={0} miw={0}>
              <Text fw={600} truncate>
                {source.title}
              </Text>
              <Text fz="sm" c="dimmed" ff="monospace" truncate>
                {source.domain}
              </Text>
            </Stack>
          </Group>

          <Divider />

          <SourceFields source={source} />
          <ReasonBlock source={source} />

          <Divider />

          <Stack gap="xs">
            {isStaff && <ProbeSourceButton source={source} />}
            <Button
              component={Link}
              to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
              variant="default"
              leftSection={<BookOpenIcon />}
            >
              {t('openCatalog')}
            </Button>
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}

export default SourceDrawer;
