import { Children, Fragment, type ReactNode } from 'react';
import { Divider, Group, Paper, Stack, Text } from '@mantine/core';

type Props = {
  /** Что стоит справа от подписи группы — только у H4. */
  labelAside?: ReactNode;
  /** Без подписи группы — B4 на странице фона шапки ставит её сам, над шапкой. */
  isLabelHidden?: boolean;
  children: ReactNode;
};

/**
 * Копия рамки GroupedList, в которой шапке можно задать фон: настоящий `GroupedList.Header` его не
 * принимает, а макетам нужно пробовать.
 */
function DemoGroup({ labelAside, isLabelHidden = false, children }: Props) {
  return (
    <Stack gap="xs">
      {!isLabelHidden && (
        <Group justify="space-between" wrap="nowrap" mih={labelAside ? 28 : undefined}>
          <Text ff="monospace" tt="uppercase" fz={12} c="dimmed" lts={1} lh={1}>
            Grouple
          </Text>
          {labelAside}
        </Group>
      )}
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        {Children.toArray(children).map((child, index) => (
          <Fragment key={index}>
            {index > 0 && <Divider />}
            {child}
          </Fragment>
        ))}
      </Paper>
    </Stack>
  );
}

export default DemoGroup;
