import { ActionIcon, Box, Group, Switch, Text } from '@mantine/core';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getSettingsMark } from '../lib';
import type { DemoSource, MarkView, IconSet } from '../models';
import LoginMarkView from './LoginMarkView';
import MarkedSourceIcon from './MarkedSourceIcon';
import styles from './LoginBadge.module.scss';

type Props = {
  source: DemoSource;
  view: MarkView;
  iconSet: IconSet;
};

/** Строка Настройки → Источники: ручка, логотип, название с пометкой, домен, выключатель. */
function SettingsRow({ source, view, iconSet }: Props) {
  const mark = getSettingsMark(source);

  return (
    <Box className={styles.row}>
      <GroupedList.Row
        icon={
          <Group gap="xs" wrap="nowrap">
            <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Изменить порядок">
              <DotsSixVerticalIcon />
            </ActionIcon>
            <MarkedSourceIcon source={source} mark={mark} view={view} iconSet={iconSet} />
          </Group>
        }
        title={
          <Group gap="xs" wrap="nowrap">
            <Text fz={14} lh="tight" truncate>
              {source.title}
            </Text>
            {mark && <LoginMarkView mark={mark} view={view} iconSet={iconSet} />}
          </Group>
        }
        description={
          <Text fz={12} lh="tight" c="dimmed" ff="monospace" truncate>
            {source.domain}
          </Text>
        }
        action={<Switch defaultChecked aria-label={source.title} />}
      />
    </Box>
  );
}

export default SettingsRow;
