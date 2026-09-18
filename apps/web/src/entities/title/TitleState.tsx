import type { MantineBreakpoint, MantineStyleProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TitleState as TitleStateType } from '@tanuki/contracts';
import StatusIndicator from '@/shared/ui/StatusIndicator';
import { getTitleStateColor, getTitleStateLabel } from './card/lib';

type Props = {
  state: TitleStateType | null;
  fz?: number;
  dotMt?: MantineStyleProps['mt'];
  coloredText?: boolean;
  fw?: MantineStyleProps['fw'];
  visibleFrom?: MantineBreakpoint;
};

function TitleState({
  state,
  fz = 12,
  dotMt = 2,
  coloredText = false,
  fw = 400,
  visibleFrom,
}: Props) {
  const { t } = useTranslation();

  if (!state) {
    return null;
  }

  return (
    <StatusIndicator
      color={getTitleStateColor(state)}
      label={getTitleStateLabel(state, t)}
      fz={fz}
      dotMt={dotMt}
      coloredText={coloredText}
      fw={fw}
      visibleFrom={visibleFrom}
    />
  );
}

export default TitleState;
