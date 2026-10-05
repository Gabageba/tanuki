import { Stack, Text } from '@mantine/core';
import { getReasonLabel } from '../lib';
import type { MockSource } from '../models';
import ErrorBlock from './ErrorBlock';

type Props = {
  source: MockSource;
};

/** D3 и D4: причина — заголовком, под ней полный текст ошибки. Ошибки нет — одна причина; нет
 *  ни причины, ни ошибки — блока нет. */
function ReasonBlock({ source }: Props) {
  if (!source.statusReason && !source.lastError) return null;

  return (
    <Stack gap={6}>
      {source.statusReason && (
        <Text fz="sm" fw={500}>
          {getReasonLabel(source.statusReason)}
        </Text>
      )}
      {source.lastError && <ErrorBlock error={source.lastError} />}
    </Stack>
  );
}

export default ReasonBlock;
