import { Anchor, Button, EmptyState, Paper, Stack, Text } from '@mantine/core';
import { BookmarkSimpleIcon, CloudArrowDownIcon, CompassIcon } from '@phosphor-icons/react';
import { EMPTY_ACTIONS, type EmptyActions } from '../models';

type Props = {
  actions: EmptyActions;
  isPhone?: boolean;
};

/** Пустые закладки (`BookmarksEmpty`) с кнопками по оси E. На телефоне кнопки — столбиком. */
function EmptyBookmarksMock({ actions, isPhone = false }: Props) {
  const catalog = (variant: 'filled' | 'default') => (
    <Button variant={variant} fullWidth={isPhone} leftSection={<CompassIcon />}>
      Открыть каталог
    </Button>
  );
  const importButton = (variant: 'filled' | 'default') => (
    <Button variant={variant} fullWidth={isPhone} leftSection={<CloudArrowDownIcon />}>
      Импорт из источника
    </Button>
  );

  const getButtons = () => {
    switch (actions) {
      case EMPTY_ACTIONS.CATALOG_ONLY:
        return catalog('default');
      case EMPTY_ACTIONS.CATALOG_MAIN:
        return (
          <>
            {catalog('filled')}
            {importButton('default')}
          </>
        );
      case EMPTY_ACTIONS.IMPORT_MAIN:
        return (
          <>
            {importButton('filled')}
            {catalog('default')}
          </>
        );
      case EMPTY_ACTIONS.BOTH_DEFAULT:
        return (
          <>
            {catalog('default')}
            {importButton('default')}
          </>
        );
      case EMPTY_ACTIONS.IMPORT_IN_DESCRIPTION:
        return catalog('default');
      case EMPTY_ACTIONS.IMPORT_LINK:
        return (
          <Stack gap="sm" align="center" w={isPhone ? '100%' : undefined}>
            {catalog('default')}
            <Text fz="sm" c="dimmed" ta="center">
              Уже читаете на другом сайте?{' '}
              <Anchor component="button" fz="sm" inherit>
                Импортируйте закладки
              </Anchor>
            </Text>
          </Stack>
        );
    }
  };

  const buttons = getButtons();

  return (
    <Paper withBorder radius="md" p="md" py="xl" w={isPhone ? 375 : 620} maw="100%">
      <EmptyState
        title="Здесь будут ваши закладки"
        description={
          actions === EMPTY_ACTIONS.IMPORT_IN_DESCRIPTION ? (
            <>
              Добавьте тайтл кнопкой «В закладки» на его странице или в читалке. Уже читаете на
              другом сайте?{' '}
              <Anchor component="button" inherit>
                Импортируйте закладки
              </Anchor>
            </>
          ) : (
            'Добавьте тайтл кнопкой «В закладки» на его странице или в читалке'
          )
        }
        icon={<BookmarkSimpleIcon />}
      >
        <EmptyState.Actions>
          {isPhone && actions !== EMPTY_ACTIONS.IMPORT_LINK ? (
            <Stack gap="xs" w="100%">
              {buttons}
            </Stack>
          ) : (
            buttons
          )}
        </EmptyState.Actions>
      </EmptyState>
    </Paper>
  );
}

export default EmptyBookmarksMock;
