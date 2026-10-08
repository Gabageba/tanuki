import { Button, Group, Text } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onRestore: () => void;
};

/** Тост после «Убрать из закладок»: действие обратимо, поэтому без модалки, но с «Вернуть». */
function RemovedFromBookmarksMessage({ onRestore }: Props) {
  const { t } = useTranslation();

  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Text fz="sm">{t('removedFromBookmarks')}</Text>
      <Button
        size="compact-sm"
        variant="subtle"
        leftSection={<ArrowCounterClockwiseIcon />}
        onClick={onRestore}
      >
        {t('restore')}
      </Button>
    </Group>
  );
}

export default RemovedFromBookmarksMessage;
