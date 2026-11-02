import { useEffect, useEffectEvent } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import type { ColorScheme } from '@tanuki/contracts';

type Props = {
  colorScheme: ColorScheme;
};

/** Схема из тулбара Storybook — в Mantine. */
function ColorSchemeSync({ colorScheme }: Props) {
  const { setColorScheme } = useMantineColorScheme();
  const applyColorScheme = useEffectEvent(setColorScheme);

  // Применяем изменение тулбара, сохраняя выбор, сделанный внутри самой истории.
  useEffect(() => applyColorScheme(colorScheme), [colorScheme]);

  return null;
}

export default ColorSchemeSync;
