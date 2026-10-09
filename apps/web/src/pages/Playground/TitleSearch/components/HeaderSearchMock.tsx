import { useContext, type ReactNode } from 'react';
import { Box, Paper, TextInput } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';

type Props = {
  /** Открытый дропдаун под строкой; без него — строка как сейчас. */
  dropdown?: ReactNode;
};

/** Строка поиска шапки в фокусе, пустая, с раскрытым под ней дропдауном. */
function HeaderSearchMock({ dropdown }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <Box w={isPhone ? '100%' : 380} maw="100%">
      <TextInput
        leftSection={<MagnifyingGlassIcon />}
        placeholder="Искать во всех источниках"
        styles={{ input: { borderColor: 'var(--mantine-primary-color-filled)' } }}
      />
      {dropdown && (
        <Paper withBorder shadow="md" radius="md" mt={6} p={4}>
          {dropdown}
        </Paper>
      )}
    </Box>
  );
}

export default HeaderSearchMock;
