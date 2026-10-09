import { ActionIcon, Anchor, Card, Group, Stack, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { NotificationItem } from '@tanuki/contracts';
import useRemoveNotification from '@/entities/notification/hooks/useRemoveNotification';
import {
  getNotificationDetail,
  getNotificationTargetPath,
  getNotificationTitle,
} from '@/entities/notification/lib';
import useDateFormat from '@/shared/hooks/useDateFormat';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import NotificationLeading from './NotificationLeading';
import styles from './NotificationRow.module.scss';

type Props = {
  item: NotificationItem;
};

/**
 * Строка ленты: карточка, весь клик ведёт к цели и считает уведомление прочитанным. Ссылка
 * растянута на карточку псевдоэлементом, чтобы корзина рядом не оказалась внутри ссылки.
 */
function NotificationRow({ item }: Props) {
  const { t } = useTranslation();
  const { formatRelative } = useDateFormat();
  const { mutate: remove } = useRemoveNotification();

  return (
    <Card withBorder radius="md" p="sm" className={styles.row}>
      <Group wrap="nowrap" gap="sm">
        <NotificationLeading item={item} />
        <Stack gap={2} flex={1} miw={0}>
          <Text fz="sm" fw={500} lh="tight" lineClamp={2}>
            <Anchor
              component={Link}
              to={getNotificationTargetPath(item)}
              onClick={() => remove(item.id)}
              c="inherit"
              underline="never"
              className={styles.link}
            >
              {getNotificationTitle(item, t)}
            </Anchor>
          </Text>
          <MidDotGroup
            items={[getNotificationDetail(item, t), formatRelative(item.updatedAt)]}
            text={{ fz: 'xs', c: 'dimmed' }}
            separatorProps={{ c: 'dimmed' }}
            lh="tight"
          />
        </Stack>
        <ActionIcon
          variant="subtle"
          color="red"
          size="md"
          flex="none"
          className={styles.remove}
          aria-label={t('removeNotification')}
          onClick={() => remove(item.id)}
        >
          <TrashIcon size={14} />
        </ActionIcon>
      </Group>
    </Card>
  );
}

export default NotificationRow;
