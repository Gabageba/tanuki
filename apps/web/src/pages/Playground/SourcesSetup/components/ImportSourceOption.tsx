import { Button, Group, Radio, Stack, Text } from '@mantine/core';
import { SignInIcon } from '@phosphor-icons/react';
import { getAccountStateColor, getAccountStateLabel } from '../lib';
import { ACCOUNT_STATE, type DemoFamily } from '../models';

type Props = {
  family: DemoFamily;
};

/** Семейство в выборе «откуда импортировать»: выбрать можно только то, где вход выполнен. */
function ImportSourceOption({ family }: Props) {
  const isActive = family.state === ACCOUNT_STATE.ACTIVE;

  return (
    <Group justify="space-between" wrap="nowrap">
      <Radio
        value={family.key}
        disabled={!isActive}
        label={
          <Stack gap={2}>
            <Text fz="sm">{family.title}</Text>
            {isActive ? (
              <Text fz={12} c="dimmed" ff="monospace">
                {family.login}
              </Text>
            ) : (
              <Text fz={12} c={getAccountStateColor(family.state)}>
                {getAccountStateLabel(family.state)}
              </Text>
            )}
          </Stack>
        }
      />
      {!isActive && (
        <Button variant="subtle" size="xs" leftSection={<SignInIcon />}>
          Войти
        </Button>
      )}
    </Group>
  );
}

export default ImportSourceOption;
