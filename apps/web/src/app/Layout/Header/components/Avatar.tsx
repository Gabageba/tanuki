import { Avatar as MantineAvatar, Group, Menu, useMantineColorScheme } from '@mantine/core';
import { PaletteIcon } from '@phosphor-icons/react';
import { COLOR_SCHEME, getColorSchemeLabel } from '@/app/Providers/models';
import { getColorSchemeIcon } from '../../utils/getColorSchemeIcon';
import styles from './../Header.module.scss';

function Avatar() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Menu>
      <Menu.Target>
        <MantineAvatar className={styles.avatar} variant="transparent" visibleFrom="md" />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<PaletteIcon />}>Тема</Menu.Sub.Item>
          </Menu.Sub.Target>

          <Menu.Sub.Dropdown>
            <Menu.RadioGroup value={colorScheme}>
              {Object.values(COLOR_SCHEME).map((value) => (
                <Menu.RadioItem key={value} value={value} onChange={() => setColorScheme(value)}>
                  <Group>
                    {getColorSchemeIcon(value)}
                    {getColorSchemeLabel(value)}
                  </Group>
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
