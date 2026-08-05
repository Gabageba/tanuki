import { Text } from '@mantine/core';
import { ApiRequestError } from '@/shared/api/client';

interface ApiErrorTextProps {
  error: unknown;
  fallback: string;
}

export default function ApiErrorText({ error, fallback }: ApiErrorTextProps) {
  return <Text c="red">{error instanceof ApiRequestError ? error.message : fallback}</Text>;
}
