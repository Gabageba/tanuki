import { useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { COLOR_SCHEME } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import ColorSchemeRow from './ColorSchemeRow';

const COLOR_SCHEMES = Object.values(COLOR_SCHEME);

type Props = {
  /** Пока грузятся настройки, блок идёт скелетоном вместе с соседями по вкладке. */
  loading: boolean;
};

/** Выбор схемы в настройках: каждая — строка с миниатюрой, чтобы сравнить их до выбора. */
function ColorSchemePicker({ loading }: Props) {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <GroupedList label={t('theme')} loading={loading} skeletonRows={COLOR_SCHEMES.length}>
      {COLOR_SCHEMES.map((value) => (
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
