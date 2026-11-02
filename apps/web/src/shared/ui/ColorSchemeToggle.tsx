import { ActionIcon, Tooltip, useMantineColorScheme, type ActionIconProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';
import { getColorSchemeIcon, getColorSchemeLabel } from '@/shared/lib/colorScheme';

type Props = Pick<ActionIconProps, 'variant' | 'color' | 'visibleFrom' | 'hiddenFrom'>;

const getNextColorScheme = (colorScheme: ColorScheme): ColorScheme => {
  switch (colorScheme) {
    case COLOR_SCHEME.LIGHT:
      return COLOR_SCHEME.DARK;
    case COLOR_SCHEME.DARK:
      return COLOR_SCHEME.AUTO;
    case COLOR_SCHEME.AUTO:
      return COLOR_SCHEME.LIGHT;
  }
};

function ColorSchemeToggle({ variant = 'default', ...props }: Props) {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const nextColorScheme = getNextColorScheme(colorScheme);
  const label = t('switchToTheme', { theme: getColorSchemeLabel(nextColorScheme, t) });

  return (
    <Tooltip label={label}>
      <ActionIcon
        {...props}
        variant={variant}
        size="lg"
        aria-label={label}
        onClick={() => setColorScheme(nextColorScheme)}
      >
        {getColorSchemeIcon(colorScheme)}
      </ActionIcon>
    </Tooltip>
  );
}

export default ColorSchemeToggle;
