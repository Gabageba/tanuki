import type { GroupProps, MantineBreakpoint } from '@mantine/core';
import { Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { getSourceStatusColor, getSourceStatusLabel } from '@/entities/source/lib';
import StatusIndicator from '@/shared/ui/StatusIndicator';
import SourceStatusBadgeTooltip from './SourceStatusBadgeTooltip';

type Props = {
  source: Source;
  visibleFrom?: MantineBreakpoint;
  justify?: GroupProps['justify'];
};

function SourceStatusBadge({ source, visibleFrom, justify }: Props) {
  const { t } = useTranslation();

  return (
    <Tooltip label={<SourceStatusBadgeTooltip source={source} />} multiline maw={280}>
      <StatusIndicator
        color={getSourceStatusColor(source.status)}
        label={getSourceStatusLabel(source.status, t)}
        dotMt={3}
        coloredText
        visibleFrom={visibleFrom}
        justify={justify}
      />
    </Tooltip>
  );
}

export default SourceStatusBadge;
