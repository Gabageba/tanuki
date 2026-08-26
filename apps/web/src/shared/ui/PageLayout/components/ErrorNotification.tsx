import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { ApiRequestError } from '@/shared/api/client';
import useQuery from '../hooks/useQuery';

type Props = {
  title: string;
  fallbackMessage: string;
};

function ErrorNotification({ title, fallbackMessage }: Props) {
  const { isError, error } = useQuery();

  useEffect(() => {
    if (isError) {
      const message = error instanceof ApiRequestError ? error.message : fallbackMessage;
      notifications.show({ color: 'red', title, message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  return null;
}

export default ErrorNotification;
