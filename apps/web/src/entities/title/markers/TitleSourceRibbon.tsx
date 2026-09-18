import { getContrastColor, Text, useMantineTheme } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import { catalogEntryFor } from '@tanuki/contracts';
import styles from './TitleMarkers.module.scss';

type Props = {
  sourceId: SourceId;
};

function TitleSourceRibbon({ sourceId }: Props) {
  const theme = useMantineTheme();
  const { title, color } = catalogEntryFor(sourceId);
  const [label] = title.split(' ');

  return (
    <Text
      className={styles.ribbon}
      bg={color}
      c={getContrastColor({ color, theme })}
      fz={11}
      fw={600}
      tt="uppercase"
      ff="monospace"
      truncate
      lh={1}
    >
      {label}
    </Text>
  );
}

export default TitleSourceRibbon;
