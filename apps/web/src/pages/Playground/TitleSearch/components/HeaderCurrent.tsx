import { Stack, TextInput, Title } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { MOCK_QUERY } from '../mocks';

type Props = {
  query?: string;
};

/** H0/E0 — как сейчас: заголовок и вторая строка ввода под ним. */
function HeaderCurrent({ query = MOCK_QUERY }: Props) {
  return (
    <Stack gap="md">
      <Title order={1}>Поиск</Title>
      <TextInput
        leftSection={<MagnifyingGlassIcon />}
        placeholder="Искать во всех источниках"
        defaultValue={query}
      />
    </Stack>
  );
}

export default HeaderCurrent;
