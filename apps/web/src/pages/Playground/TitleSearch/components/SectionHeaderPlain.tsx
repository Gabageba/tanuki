import { Title } from '@mantine/core';
import type { Source } from '@tanuki/contracts';

type Props = {
  source: Source;
};

/** S0 — как сейчас: только название источника заголовком. */
function SectionHeaderPlain({ source }: Props) {
  return <Title order={3}>{source.title}</Title>;
}

export default SectionHeaderPlain;
