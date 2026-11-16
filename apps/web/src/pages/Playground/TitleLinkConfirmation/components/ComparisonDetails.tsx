import { Accordion, SimpleGrid, Stack, Text } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';

type Props = { original: Title; candidate: Title };

function ComparisonDetails({ original, candidate }: Props) {
  const rows = [
    { label: 'Авторы', values: [original.authors.join(', '), candidate.authors.join(', ')] },
    { label: 'Художники', values: [original.artists.join(', '), candidate.artists.join(', ')] },
    { label: 'Год', values: [original.year, candidate.year], isNumeric: true },
    {
      label: 'Другие названия',
      values: [original.altNames.join(' · '), candidate.altNames.join(' · ')],
    },
    { label: 'Описание', values: [original.description, candidate.description] },
  ];

  return (
    <Accordion variant="default" chevronPosition="right">
      <Accordion.Item value="details">
        <Accordion.Control px={0}>Авторы, год и описание</Accordion.Control>
        <Accordion.Panel styles={{ content: { padding: '0 0 var(--mantine-spacing-sm)' } }}>
          <Stack gap="md">
            {rows.map(({ label, values, isNumeric }) => (
              <Stack key={label} gap={4}>
                <Text fz="xs" c="dimmed">
                  {label}
                </Text>
                <SimpleGrid cols={2} spacing="md">
                  {values.map((value, index) => (
                    <Text
                      key={index}
                      fz="sm"
                      ff={isNumeric ? 'monospace' : undefined}
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {value ?? <Mdash />}
                      {value === '' && <Mdash />}
                    </Text>
                  ))}
                </SimpleGrid>
              </Stack>
            ))}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

export default ComparisonDetails;
