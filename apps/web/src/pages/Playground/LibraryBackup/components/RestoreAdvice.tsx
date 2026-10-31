import { Anchor, Button, Stack, Text } from '@mantine/core';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { ADVICE_VIEW, type AdviceView } from '../models';

type Props = {
  view: AdviceView;
};

/** W — совет скачать текущую копию; появляется, когда выбор что-то заменяет. Кнопку W3 рисует
 *  сама модалка — в ряду кнопок. */
function RestoreAdvice({ view }: Props) {
  switch (view) {
    case ADVICE_VIEW.TEXT:
      return (
        <Stack gap="xs" align="flex-start">
          <Text c="dimmed" fz={13}>
            Это нельзя отменить. Скачайте копию текущей библиотеки перед восстановлением.
          </Text>
          <Button variant="light" size="xs" leftSection={<DownloadSimpleIcon />}>
            Скачать текущую копию
          </Button>
        </Stack>
      );
    case ADVICE_VIEW.ROW:
      return (
        <GroupedList label="Перед восстановлением">
          <GroupedList.Row
            icon={<DownloadSimpleIcon />}
            title="Текущая библиотека"
            description="Восстановление нельзя отменить — сохраните её копию"
            actionProps={{ leftSection: <DownloadSimpleIcon />, children: 'Скачать копию' }}
          />
        </GroupedList>
      );
    case ADVICE_VIEW.BUTTON:
      return (
        <Text c="dimmed" fz={13}>
          Это нельзя отменить. Скачайте копию текущей библиотеки перед восстановлением.
        </Text>
      );
    case ADVICE_VIEW.LINK:
      return (
        <Text c="dimmed" fz={13}>
          Это нельзя отменить. Перед восстановлением{' '}
          <Anchor component="button" type="button" fz={13}>
            скачайте копию текущей библиотеки
          </Anchor>
          .
        </Text>
      );
  }
}

export default RestoreAdvice;
