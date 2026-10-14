import { ActionIcon, Box, Group, Switch, Text } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import SourceLoginBadge from '@/entities/source/components/SourceLoginBadge';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import GroupedList from '@/shared/ui/GroupedList';
import useToggleSource from './hooks/useToggleSource';
import { isSourceLoginOffered } from './lib';
import styles from '../../Settings.module.scss';

type Props = {
  source: Source;
};

function SourceToggleRow({ source }: Props) {
  const { t } = useTranslation();
  const toggleSource = useToggleSource();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: source.id,
  });

  return (
    <Box
      ref={setNodeRef}
      className={styles.sortableRow}
      mod={{ dragging: isDragging }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <GroupedList.Row
        icon={
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              className={styles.dragHandle}
              aria-label={t('changeOrder')}
              {...attributes}
              {...listeners}
            >
              <DotsSixVerticalIcon />
            </ActionIcon>
            <SourceIcon id={source.id} title={source.title} size={32} />
          </Group>
        }
        title={
          <Group gap="xs" wrap="nowrap">
            <Text fz={14} lh="tight" truncate>
              {source.title}
            </Text>
            {/* Войти можно только в профиле — пометка ведёт на вкладку аккаунтов. */}
            {isSourceLoginOffered(source) && (
              <SourceLoginBadge source={source} to={SOURCE_ACCOUNTS_PATH} />
            )}
          </Group>
        }
        description={
          <Text fz={12} lh="tight" c="dimmed" ff="monospace" truncate>
            {source.domain}
          </Text>
        }
        action={
          <Switch
            checked={source.isEnabled}
            onChange={(event) =>
              toggleSource.mutate({ sourceId: source.id, isEnabled: event.currentTarget.checked })
            }
            aria-label={source.title}
            classNames={{ track: styles.switchTrack }}
          />
        }
      />
    </Box>
  );
}

export default SourceToggleRow;
