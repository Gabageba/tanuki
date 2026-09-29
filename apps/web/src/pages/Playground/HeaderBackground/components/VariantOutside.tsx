import { Stack, Text } from '@mantine/core';
import { DEMO_SOURCES, type VariantProps } from '../../AccountGroups/models';
import DemoGroup from '../../AccountGroups/components/DemoGroup';
import DemoSourceRow from '../../AccountGroups/components/DemoSourceRow';
import DemoHeader from './DemoHeader';

/**
 * B4 — шапка стоит над рамкой, прямо на фоне страницы: в рамке только источники, и фон шапки
 * выбирать не из чего.
 */
function VariantOutside({ state }: VariantProps) {
  return (
    <Stack gap="xs">
      <Text ff="monospace" tt="uppercase" fz={12} c="dimmed" lts={1} lh={1}>
        Grouple
      </Text>
      <DemoHeader state={state} px={0} />
      <DemoGroup isLabelHidden>
        {DEMO_SOURCES.map((source) => (
          <DemoSourceRow key={source.id} source={source} />
        ))}
      </DemoGroup>
    </Stack>
  );
}

export default VariantOutside;
