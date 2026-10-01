import { Box, Group, Text } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import { getProfileMark } from '../lib';
import type { DemoSource, MarkView, IconSet } from '../models';
import LoginMarkView from './LoginMarkView';
import MarkedSourceIcon from './MarkedSourceIcon';
import styles from './LoginBadge.module.scss';

type Props = {
  source: DemoSource;
  view: MarkView;
  iconSet: IconSet;
  /** Пометка за названием, как в настройках, а не справа в строке. */
  isMarkInTitle: boolean;
};

/** Строка Профиль → Аккаунты источников: что даст вход, пометка справа или за названием. */
function ProfileRow({ source, view, iconSet, isMarkInTitle }: Props) {
  const mark = getProfileMark(source);

  return (
    <Box className={styles.row}>
      <GroupedList.Row
        icon={<MarkedSourceIcon source={source} mark={mark} view={view} iconSet={iconSet} />}
        title={
          isMarkInTitle ? (
            <Group gap="xs" wrap="nowrap">
              <Text fz={14} lh="tight" truncate>
                {source.title}
              </Text>
              {mark && <LoginMarkView mark={mark} view={view} iconSet={iconSet} />}
            </Group>
          ) : (
            source.title
          )
        }
        description={`Вход даст: ${source.benefits}`}
        action={
          !isMarkInTitle && mark && <LoginMarkView mark={mark} view={view} iconSet={iconSet} />
        }
      />
    </Box>
  );
}

export default ProfileRow;
