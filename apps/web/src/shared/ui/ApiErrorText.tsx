import { Text } from '@mantine/core';

type Props = {
  error: Error | null;
};

function ApiErrorText({ error }: Props) {
  if (!error) {
    return null;
  }

  return <Text c="red">{error.message}</Text>;
}

export default ApiErrorText;
