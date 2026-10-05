import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { getSourceStatusReasonLabel } from '@/entities/source/lib';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  source: Source;
};

/** Причина и под ней две строки ошибки — «что случилось» и «как именно» читаются вместе. Ошибки
 *  нет (`broken`, `recovered`) — одна причина; нет ни того, ни другого — прочерк. Полная ошибка —
 *  в карточке. */
function ReasonCell({ source }: Props) {
  const { t } = useTranslation();

  if (!source.statusReason && !source.lastError) return <Mdash lh="tight" c="dimmed" fz="sm" />;

  return (
    <Stack gap={2} miw={0}>
      {source.statusReason && (
        <Text lh="tight" fz="xs" truncate>
          {getSourceStatusReasonLabel(source.statusReason, t)}
        </Text>
      )}
      {source.lastError && (
        <Text
          lh="tight"
          fz="xs"
          c="dimmed"
          ff="monospace"
          lineClamp={2}
          style={{ wordBreak: 'break-all' }}
        >
          {source.lastError}
        </Text>
      )}
    </Stack>
  );
}

export default ReasonCell;
