import type { MantineStyleProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { MangaState as MangaStateType } from '@tanuki/contracts';
import StatusIndicator from '@/shared/ui/StatusIndicator';
import { getMangaStateColor, getMangaStateLabel } from './card/lib';

type Props = {
  state: MangaStateType;
  fz?: number;
  dotMt?: MantineStyleProps['mt'];
  coloredText?: boolean;
  fw?: MantineStyleProps['fw'];
};

function MangaState({ state, fz = 12, dotMt = 2, coloredText = false, fw = 400 }: Props) {
  const { t } = useTranslation();

  return (
    <StatusIndicator
      color={getMangaStateColor(state)}
      label={getMangaStateLabel(state, t)}
      fz={fz}
      dotMt={dotMt}
      coloredText={coloredText}
      fw={fw}
      visibleFrom="xxs"
    />
  );
}

export default MangaState;
