import { useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import type { ColorScheme } from '@tanuki/contracts';

type Props = {
  colorScheme: ColorScheme;
};

/** Схема из тулбара Storybook — в Mantine. */
function ColorSchemeSync({ colorScheme }: Props) {
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => setColorScheme(colorScheme), [colorScheme, setColorScheme]);

  return null;
}

export default ColorSchemeSync;
