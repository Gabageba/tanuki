import { Anchor, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { ROUTE_PATHS, SETTINGS_TAB_SEARCH_PARAM, SETTINGS_TABS } from '@/shared/lib/routes';

type Props = {
  /** Итог — вкладка «Подборки»: выключенное не показывается на странице подборок, а не на главной. */
  isSelectionsTab?: boolean;
};

/** Пояснение над списком вкладки «Главная»: что такое подборки и где меняется порядок. */
function HomeSettingsHint({ isSelectionsTab = false }: Props) {
  return (
    <Stack gap={4}>
      <Text c="dimmed">
        Подборки — блоки с главных страниц сайтов. Выключенные источники и блоки{' '}
        {isSelectionsTab ? 'в подборках' : 'на главной'} не показываются.
      </Text>
      <Text c="dimmed">
        Порядок источников общий для всего приложения — он меняется во вкладке{' '}
        <Anchor
          component={Link}
          to={`${ROUTE_PATHS.SETTINGS}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.SOURCES}`}
          inherit
        >
          «Источники»
        </Anchor>
        .
      </Text>
    </Stack>
  );
}

export default HomeSettingsHint;
