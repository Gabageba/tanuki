import { Button } from '@mantine/core';
import { Link } from 'react-router';
import { BooksIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { MOCK_QUERY } from '../mocks';

type Props = {
  source: Source;
};

/** S3 — «Все результаты» под карточками, как продолжение списка. */
function SectionFooterButton({ source }: Props) {
  return (
    <Button
      component={Link}
      to={`/catalog/${source.id}?query=${encodeURIComponent(MOCK_QUERY)}`}
      variant="default"
      fullWidth
      leftSection={<BooksIcon />}
    >
      Все результаты в {source.title}
    </Button>
  );
}

export default SectionFooterButton;
