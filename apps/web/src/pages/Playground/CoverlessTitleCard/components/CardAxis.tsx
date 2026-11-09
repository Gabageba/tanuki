import type { ReactNode } from 'react';
import { Stack, Title } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import type { Example, Variant } from '../models';
import CardComparison from './CardComparison';

type Props = {
  letter: string;
  title: string;
  variants: Variant[];
  examples: Example[];
  wide?: boolean;
  children?: ReactNode;
};

function CardAxis({ letter, title, variants, examples, wide, children }: Props) {
  return (
    <Stack gap="xl">
      <Title order={3} id={`axis-${letter}`}>
        {letter} · {title}
      </Title>
      {variants.map(({ options, ...variant }) => (
        <DemoSection key={variant.code} {...variant}>
          <CardComparison examples={examples} wide={wide} {...options} />
        </DemoSection>
      ))}
      {children}
    </Stack>
  );
}

export default CardAxis;
