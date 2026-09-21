import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Button, Collapse, Drawer, Stack, useMantineColorScheme } from '@mantine/core';
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  GlobeIcon,
  ListIcon,
  PaletteIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import MobileNavigationButton from './MobileNavigationButton';
import { getColorSchemeIcon } from '../../utils/getColorSchemeIcon';
import { COLOR_SCHEME, getColorSchemeLabel } from '@/app/Providers/models';
import { LANGUAGE, getLanguageLabel } from '@/shared/lib/language';
import styles from './../../Layout.module.scss';

type Props = {
  isActive: boolean;
  isOpened: boolean;
  setIsOpened: Dispatch<SetStateAction<boolean>>;
};

function MobileMenuButton({ isOpened, isActive, setIsOpened }: Props) {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [isThemeOpened, setIsThemeOpened] = useState(false);
  const [isLanguageOpened, setIsLanguageOpened] = useState(false);

  return (
    <>
      <MobileNavigationButton
        onClick={() => setIsOpened((prev) => !prev)}
        title={t('menu')}
        leftSection={<ListIcon size={20} />}
        isActive={isActive}
      />
      <Drawer
        opened={isOpened}
        onClose={() => setIsOpened(false)}
        title={t('menu')}
        position="right"
      >
        <Stack gap={4}>
          <Button
            className={styles.switcherOption}
            onClick={() => setIsThemeOpened((prev) => !prev)}
            variant="selectable"
            justify="flex-start"
            size="md"
            leftSection={<PaletteIcon />}
            rightSection={isThemeOpened ? <CaretUpIcon /> : <CaretDownIcon />}
          >
            {t('theme')}
          </Button>
          <Collapse expanded={isThemeOpened}>
            <Stack gap={4} pl="lg">
              {Object.values(COLOR_SCHEME).map((value) => (
                <Button
                  key={value}
                  data-active={colorScheme === value || undefined}
                  className={styles.switcherOption}
                  onClick={() => setColorScheme(value)}
                  variant="selectable"
                  justify="flex-start"
                  size="md"
                  leftSection={getColorSchemeIcon(value)}
                  rightSection={
                    colorScheme === value && (
                      <CheckIcon color="var(--mantine-primary-color-filled)" />
                    )
                  }
                >
                  {getColorSchemeLabel(value, t)}
                </Button>
              ))}
            </Stack>
          </Collapse>
          <Button
            className={styles.switcherOption}
            onClick={() => setIsLanguageOpened((prev) => !prev)}
            variant="selectable"
            justify="flex-start"
            size="md"
            leftSection={<GlobeIcon />}
            rightSection={isLanguageOpened ? <CaretUpIcon /> : <CaretDownIcon />}
          >
            {t('language')}
          </Button>
          <Collapse expanded={isLanguageOpened}>
            <Stack gap={4} pl="lg">
              {Object.values(LANGUAGE).map((value) => (
                <Button
                  key={value}
                  data-active={i18n.language === value || undefined}
                  className={styles.switcherOption}
                  onClick={() => i18n.changeLanguage(value)}
                  variant="selectable"
                  justify="flex-start"
                  size="md"
                  rightSection={
                    i18n.language === value && (
                      <CheckIcon color="var(--mantine-primary-color-filled)" />
                    )
                  }
                >
                  {getLanguageLabel(value)}
                </Button>
              ))}
            </Stack>
          </Collapse>
        </Stack>
      </Drawer>
    </>
  );
}

export default MobileMenuButton;
