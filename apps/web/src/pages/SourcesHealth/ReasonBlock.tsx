import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { getSourceStatusReasonLabel } from '@/entities/source/lib';
import ErrorBlock from './ErrorBlock';

type Props = {
  source: Source;
};

/** Причина заголовком, под ней полный текст ошибки. Ошибки нет — одна причина; нет ни причины,
 *  ни ошибки — блока нет. */
function ReasonBlock({ source }: Props) {
  const { t } = useTranslation();

  if (!source.statusReason && !source.lastError) return null;

  return (
    <Stack gap={6}>
      {source.statusReason && (
        <Text fz="sm" fw={500}>
          {getSourceStatusReasonLabel(source.statusReason, t)}
        </Text>
      )}
      {source.lastError && <ErrorBlock error={source.lastError} />}
    </Stack>
  );
}

export default ReasonBlock;
