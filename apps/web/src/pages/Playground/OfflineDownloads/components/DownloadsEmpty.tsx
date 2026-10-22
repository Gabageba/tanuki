import { Button, EmptyState } from '@mantine/core';
import { CompassIcon, DownloadSimpleIcon } from '@phosphor-icons/react';

type Props = {
  /** E2 — описание учит, как скачать. */
  withHowTo?: boolean;
};

/** На странице «Загрузки» ничего нет: ни очереди, ни скачанного. */
function DownloadsEmpty({ withHowTo = false }: Props) {
  return (
    <EmptyState
      title="Ничего не скачано"
      description={
        withHowTo
          ? 'Нажмите стрелку у главы или «Скачать все» над списком глав — главы появятся здесь и откроются без сети'
          : 'Скачанные главы можно читать без сети'
      }
      icon={<DownloadSimpleIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<CompassIcon />}>
          Открыть каталог
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default DownloadsEmpty;
