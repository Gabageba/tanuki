import { Container } from '@mantine/core';
import { useTranslation } from 'react-i18next';

function Notifications() {
  const { t } = useTranslation();

  return <Container>{t('notifications')}</Container>;
}

export default Notifications;
