import { Text } from '@mantine/core';
import { ApiRequestError } from '@/shared/api/client';

type Props = {
  error: unknown;
  fallback: string;
};

function ApiErrorText({ error, fallback }: Props) {
  return <Text c="red">{error instanceof ApiRequestError ? error.message : fallback}</Text>;
}

export default ApiErrorText;
