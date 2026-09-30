import { useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { COLOR_SCHEME } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import ColorSchemeRow from './ColorSchemeRow';

/** Выбор схемы в настройках: каждая — строка с миниатюрой, чтобы сравнить их до выбора. */
function ColorSchemePicker() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <GroupedList label={t('theme')}>
      {Object.values(COLOR_SCHEME).map((value) => (
        <ColorSchemeRow
          key={value}
          colorScheme={value}
          isSelected={value === colorScheme}
          onSelect={setColorScheme}
        />
      ))}
    </GroupedList>
  );
}

export default ColorSchemePicker;
