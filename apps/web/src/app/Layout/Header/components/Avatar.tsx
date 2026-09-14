import { Avatar as MantineAvatar, Group, Menu, useMantineColorScheme } from '@mantine/core';
import { GlobeIcon, PaletteIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { COLOR_SCHEME, getColorSchemeLabel } from '@/app/Providers/models';
import { LANGUAGE, getLanguageLabel } from '@/shared/lib/language';
import { getColorSchemeIcon } from '../../utils/getColorSchemeIcon';
import styles from './../Header.module.scss';

function Avatar() {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Menu>
      <Menu.Target>
        <MantineAvatar className={styles.avatar} variant="transparent" visibleFrom="md" />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<PaletteIcon />}>{t('theme')}</Menu.Sub.Item>
          </Menu.Sub.Target>

          <Menu.Sub.Dropdown>
            <Menu.RadioGroup value={colorScheme}>
              {Object.values(COLOR_SCHEME).map((value) => (
                <Menu.RadioItem key={value} value={value} onChange={() => setColorScheme(value)}>
                  <Group>
                    {getColorSchemeIcon(value)}
                    {getColorSchemeLabel(value, t)}
                  </Group>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<GlobeIcon />}>{t('language')}</Menu.Sub.Item>
          </Menu.Sub.Target>

          <Menu.Sub.Dropdown>
            <Menu.RadioGroup value={i18n.language}>
              {Object.values(LANGUAGE).map((value) => (
                <Menu.RadioItem
                  key={value}
                  value={value}
                  onChange={() => i18n.changeLanguage(value)}
                >
                  {getLanguageLabel(value)}
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
      </Menu.Dropdown>
    </Menu>
  );
}

export default Avatar;
