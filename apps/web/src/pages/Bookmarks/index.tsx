import { Container } from '@mantine/core';
import { useTranslation } from 'react-i18next';

function Bookmarks() {
  const { t } = useTranslation();

  return <Container>{t('bookmarks')}</Container>;
}

export default Bookmarks;
