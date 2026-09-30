import { Group, Text } from '@mantine/core';
import { getAccountStateColor, getAccountStateLabel } from '../../SourcesSetup/lib';
import { isImportAvailable } from '../lib';
import type { DemoImportSource } from '../models';

type Props = {
  source: DemoImportSource;
};

/** Вторая строка источника: чьим аккаунтом он открыт, а если входа нет — почему выбрать нельзя. */
function SourceAccountLine({ source }: Props) {
  if (!isImportAvailable(source)) {
    return (
      <Text fz={12} c={getAccountStateColor(source.state)} lh={1.2}>
        {getAccountStateLabel(source.state)}
      </Text>
    );
  }

  return (
    <Group gap={6} wrap="nowrap">
      <Text fz={12} c="dimmed" lh={1.2}>
        {source.network}
      </Text>
      <Text fz={12} c="dimmed" ff="monospace" lh={1.2} truncate>
        {source.login}
      </Text>
    </Group>
  );
}

export default SourceAccountLine;
