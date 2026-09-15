import type { MantineBreakpoint, MantineStyleProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { MangaState as MangaStateType } from '@tanuki/contracts';
import StatusIndicator from '@/shared/ui/StatusIndicator';
import { getMangaStateColor, getMangaStateLabel } from './card/lib';

type Props = {
  state: MangaStateType | null;
  fz?: number;
  dotMt?: MantineStyleProps['mt'];
  coloredText?: boolean;
  fw?: MantineStyleProps['fw'];
  visibleFrom?: MantineBreakpoint;
};

function MangaState({
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
      color={getMangaStateColor(state)}
      label={getMangaStateLabel(state, t)}
      fz={fz}
      dotMt={dotMt}
      coloredText={coloredText}
      fw={fw}
      visibleFrom={visibleFrom}
    />
  );
}

export default MangaState;
