import { Anchor, Group } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowRightIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { MOCK_QUERY } from '../mocks';

type Props = {
  source: Source;
};

/** «Все результаты» — в каталог источника с тем же запросом. */
function AllResultsLink({ source }: Props) {
  return (
    <Anchor
      component={Link}
      to={`/catalog/${source.id}?query=${encodeURIComponent(MOCK_QUERY)}`}
      fz="sm"
      flex="none"
    >
      <Group gap={4} wrap="nowrap">
        Все результаты
        <ArrowRightIcon />
      </Group>
    </Anchor>
  );
}

export default AllResultsLink;
