import type { MantineStyleProps } from '@mantine/core';
import { Text } from '@mantine/core';
import styles from '../Title.module.scss';

type Props = {
  name: string;
  lineClamp?: number;
  fz?: MantineStyleProps['fz'];
};

/** Название тайтла на карточке: окрашивается при наведении на карточку-плитку. */
function TitleCardName({ name, lineClamp = 2, fz }: Props) {
  return (
    <Text className={styles.title} lineClamp={lineClamp} lh="tight" fz={fz}>
      {name}
    </Text>
  );
}

export default TitleCardName;
