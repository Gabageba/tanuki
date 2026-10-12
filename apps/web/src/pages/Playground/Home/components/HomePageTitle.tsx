import { Divider, Group, Stack, Title } from '@mantine/core';
import { MOCK_SOURCES_TOTAL } from '../mocks';
import AllSourcesLink from './AllSourcesLink';

type Props = {
  /** V1, V4 — «Все источники» живут ниже, у заголовка кнопки нет. */
  withAllSources?: boolean;
  /** V3 — кнопка заметнее: светлая заливка и счётчик источников. */
  isAllSourcesProminent?: boolean;
};

/** A1 — заголовок «Главная» с кнопкой «Все источники» и линией, как у страниц в PageLayout. */
function HomePageTitle({ withAllSources = true, isAllSourcesProminent = false }: Props) {
  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Title order={2}>Главная</Title>
        {withAllSources && (
          <AllSourcesLink
            asButton
            isLight={isAllSourcesProminent}
            count={isAllSourcesProminent ? MOCK_SOURCES_TOTAL : undefined}
          />
        )}
      </Group>
      <Divider />
    </Stack>
  );
}

export default HomePageTitle;
