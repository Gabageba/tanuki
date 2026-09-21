import { ActionIcon, Drawer } from '@mantine/core';
import { FadersHorizontalIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ReaderSettingsButton() {
  const { t } = useTranslation();
  const [isDrawerOpened, setIsDrawerOpened] = useState(false);

  return (
    <>
      <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setIsDrawerOpened(true)}>
        <FadersHorizontalIcon />
      </ActionIcon>
      <Drawer
        opened={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        position="right"
        title={t('readerSettings')}
      >
        {t('readerSettings')}
      </Drawer>
    </>
  );
}

export default ReaderSettingsButton;
