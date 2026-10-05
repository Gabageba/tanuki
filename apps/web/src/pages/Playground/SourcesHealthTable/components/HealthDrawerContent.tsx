import { Button, Divider, Group, Stack, Text } from '@mantine/core';
import { BookOpenIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import DrawerField from './DrawerField';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import { getContentTypeLabel, getReasonLabel, isReasonWithError, isSourceInTitle } from '../lib';
import { DRAWER_LAYOUT, VIEWER, type DrawerLayout, type MockSource, type Viewer } from '../models';
import ErrorBlock from './ErrorBlock';
import HealthStatusBadge from './HealthStatusBadge';
import ProbeButton from './ProbeButton';
import ReasonBlock from './ReasonBlock';
import StatusSince from './StatusSince';

type Props = {
  source: MockSource;
  layout: DrawerLayout;
  viewer: Viewer;
};

/** Карточка источника: шапка как у пользователя (иконка, название, домен), поля `DrawerField`,
 *  ошибка блоком — внизу полей (D1) или сразу под шапкой (D2). В D3 и D4 то же, но причина
 *  уходит из полей заголовком к ошибке. Действия внизу. */
function HealthDrawerContent({ source, layout, viewer }: Props) {
  const { formatDateTime, formatRelative } = useDateFormat();
  const withReasonBlock = isReasonWithError(layout);
  const isErrorFirst =
    layout === DRAWER_LAYOUT.ERROR_FIRST || layout === DRAWER_LAYOUT.REASON_WITH_ERROR_FIRST;

  return (
    <Stack gap="md">
      {!isSourceInTitle(layout) && (
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
      )}

      {isErrorFirst &&
        (withReasonBlock ? (
          <ReasonBlock source={source} />
        ) : (
          source.lastError && <ErrorBlock error={source.lastError} />
        ))}

      {!isSourceInTitle(layout) && <Divider />}

      <Stack gap="sm">
        <DrawerField label="Статус">
          <HealthStatusBadge status={source.status} />
          <StatusSince statusChangedAt={source.statusChangedAt} />
        </DrawerField>
        {!withReasonBlock && (
          <DrawerField label="Причина">
            {source.statusReason ? (
              <Text fz="sm">{getReasonLabel(source.statusReason)}</Text>
            ) : (
              <Mdash c="dimmed" />
            )}
          </DrawerField>
        )}
        <DrawerField label="Контент">
          <Text fz="sm">{getContentTypeLabel(source.contentType)}</Text>
        </DrawerField>
        <DrawerField label="Проверен">
          {source.checkedAt ? (
            <>
              <Text fz="sm">{formatRelative(source.checkedAt)}</Text>
              <Text fz="xs" c="dimmed">
                {formatDateTime(source.checkedAt)}
              </Text>
            </>
          ) : (
            <Mdash c="dimmed" />
          )}
        </DrawerField>
        <DrawerField label="Упало ночей подряд">
          <Text fz="sm" ff="monospace">
            {source.failedProbeStreak}
          </Text>
        </DrawerField>
      </Stack>

      {!isErrorFirst && withReasonBlock && <ReasonBlock source={source} />}

      {!isErrorFirst && !withReasonBlock && source.lastError && (
        <Stack gap={6}>
          <Text fz="sm" c="dimmed">
            Ошибка
          </Text>
          <ErrorBlock error={source.lastError} />
        </Stack>
      )}

      <Divider />

      <Stack gap="xs">
        {viewer === VIEWER.STAFF && <ProbeButton label="Проверить сейчас" />}
        <Button variant="default" leftSection={<BookOpenIcon />}>
          Открыть каталог
        </Button>
      </Stack>
    </Stack>
  );
}

export default HealthDrawerContent;
