import { Anchor, Group, Title } from '@mantine/core';
import { Link } from 'react-router';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { MOCK_QUERY } from '../mocks';

type Props = {
  source: Source;
};

/** S5 — весь заголовок ведёт в каталог источника: «ReadManga ›», как в Mihon и Google Play. */
function SectionHeaderTitleLink({ source }: Props) {
  return (
    <Anchor
      component={Link}
      to={`/catalog/${source.id}?query=${encodeURIComponent(MOCK_QUERY)}`}
      c="inherit"
      underline="hover"
      w="fit-content"
      maw="100%"
    >
      <Group gap="xs" wrap="nowrap">
        <SourceIcon id={source.id} title={source.title} size={28} />
        <Title order={4} lineClamp={1}>
          {source.title}
        </Title>
        <CaretRightIcon size={18} />
      </Group>
    </Anchor>
  );
}

export default SectionHeaderTitleLink;
