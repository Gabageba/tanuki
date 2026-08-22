import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Button, Collapse, Stack, useMantineColorScheme } from '@mantine/core';
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  ListIcon,
  PaletteIcon,
} from '@phosphor-icons/react';
import MobileNavigationButton from './MobileNavigationButton';
import MobileNavigationDrawer from './MobileNavigationDrawer';
import { getColorSchemeIcon } from '../../utils/getColorSchemeIcon';
import { COLOR_SCHEME, getColorSchemeLabel } from '@/app/Providers/models';
import styles from './../../Layout.module.scss';

type Props = {
  isActive: boolean;
  isOpened: boolean;
  setIsOpened: Dispatch<SetStateAction<boolean>>;
};

function MobileMenuButton({ isOpened, isActive, setIsOpened }: Props) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [isThemeOpened, setIsThemeOpened] = useState(false);

  return (
    <>
      <MobileNavigationButton
        onClick={() => setIsOpened((prev) => !prev)}
        title="Меню"
        leftSection={<ListIcon size={20} />}
        isActive={isActive}
      />
      <MobileNavigationDrawer opened={isOpened} onClose={() => setIsOpened(false)} title="Меню">
        <Stack gap={4}>
          <Button
            className={styles.switcherOption}
            onClick={() => setIsThemeOpened((prev) => !prev)}
            variant="subtle"
            color="gray"
            justify="flex-start"
            size="md"
            leftSection={<PaletteIcon />}
            rightSection={isThemeOpened ? <CaretUpIcon /> : <CaretDownIcon />}
          >
            Тема
          </Button>
          <Collapse expanded={isThemeOpened}>
            <Stack gap={4} pl="lg">
              {Object.values(COLOR_SCHEME).map((value) => (
                <Button
                  key={value}
                  data-active={colorScheme === value || undefined}
                  className={styles.switcherOption}
                  onClick={() => setColorScheme(value)}
                  variant="subtle"
                  color="gray"
                  justify="flex-start"
                  size="md"
                  leftSection={getColorSchemeIcon(value)}
                  rightSection={
                    colorScheme === value && (
                      <CheckIcon color="var(--mantine-primary-color-filled)" />
                    )
                  }
                >
                  {getColorSchemeLabel(value)}
                </Button>
              ))}
            </Stack>
          </Collapse>
        </Stack>
      </MobileNavigationDrawer>
    </>
  );
}

export default MobileMenuButton;
