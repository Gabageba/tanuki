import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { ApiRequestError } from '@/shared/api/client';
import usePageLayoutQuery from '../hooks/usePageLayoutQuery';

type Props = {
  title: string;
  fallbackMessage: string;
};

function ErrorNotification({ title, fallbackMessage }: Props) {
  const { isError, error } = usePageLayoutQuery();

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
