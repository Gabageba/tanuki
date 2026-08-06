import { ActionIcon, Menu, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { CheckIcon, DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import {
  COLOR_SCHEME,
  getColorSchemeLabel,
  type ColorScheme,
} from '@/app/components/Providers/models';

// Возвращаем готовый элемент, а не сам компонент: компонент, полученный из вызова функции
// во время рендера, теряет состояние при каждом рендере — на это ругается react-hooks.
const getColorSchemeIcon = (colorScheme: ColorScheme, size: number) => {
  switch (colorScheme) {
    case COLOR_SCHEME.LIGHT:
      return <SunIcon size={size} />;
    case COLOR_SCHEME.DARK:
      return <MoonIcon size={size} />;
    case COLOR_SCHEME.AUTO:
      return <DesktopIcon size={size} />;
  }
};

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  // Значение media query недоступно на первом рендере: без getInitialValueInEffect иконка
  // успевает моргнуть светлой темой у пользователей с тёмной системной.
  const computedColorScheme = useComputedColorScheme(COLOR_SCHEME.LIGHT, {
    getInitialValueInEffect: true,
  });

  return (
    <Menu position="bottom-end" width={180} withinPortal>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label="Тема оформления">
          {/* Показываем то, что видно сейчас, а не выбранный режим: у `auto` своей иконки нет. */}
          {getColorSchemeIcon(computedColorScheme, 18)}
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {Object.values(COLOR_SCHEME).map((scheme) => (
          <Menu.Item
            key={scheme}
            leftSection={getColorSchemeIcon(scheme, 16)}
            rightSection={scheme === colorScheme ? <CheckIcon size={14} /> : null}
            onClick={() => setColorScheme(scheme)}
          >
            {getColorSchemeLabel(scheme)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export default ColorSchemeToggle;
