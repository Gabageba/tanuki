import { EmptyState } from '@mantine/core';
import { ProhibitIcon } from '@phosphor-icons/react';

type Props = {
  withHowTo?: boolean;
};

/** Браузер без service worker или IndexedDB — например, приватное окно. */
function DownloadsUnsupported({ withHowTo = false }: Props) {
  return (
    <EmptyState
      title="Скачивание недоступно"
      description={
        withHowTo
          ? 'Этот браузер не даёт сохранять главы — так бывает в приватном окне. Откройте Tanuki в обычном окне или установите приложение'
          : 'Этот браузер не даёт сохранять главы — так бывает в приватном окне'
      }
      icon={<ProhibitIcon />}
    />
  );
}

export default DownloadsUnsupported;
