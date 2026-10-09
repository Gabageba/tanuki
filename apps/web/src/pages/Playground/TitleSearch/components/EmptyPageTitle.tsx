import { Title } from '@mantine/core';
import PageHeaderBox from './PageHeaderBox';

/** Шапка пустой `/search`: только заголовок. */
function EmptyPageTitle() {
  return (
    <PageHeaderBox>
      <Title order={2}>Поиск</Title>
    </PageHeaderBox>
  );
}

export default EmptyPageTitle;
