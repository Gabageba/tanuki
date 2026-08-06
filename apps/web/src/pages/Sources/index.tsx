import { Container, Title } from '@mantine/core';
import SourcesList from './SourcesList';

function Sources() {
  return (
    <Container py="xl" size="xl">
      <Title order={2} mb="xl">
        Источники
      </Title>
      <SourcesList />
    </Container>
  );
}

export default Sources;
