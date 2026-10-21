import type { ReactNode } from 'react';
import { Anchor, Group } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowLineRightIcon } from '@phosphor-icons/react';
import styles from './ArrowLink.module.scss';

type Props = {
  to: string;
  children: ReactNode;
};

/** Ссылка со стрелкой перед текстом справа от заголовка блока — «Все закладки», «Каталог», «Все результаты». */
function ArrowLink({ to, children }: Props) {
  return (
    <Anchor component={Link} to={to} underline="never" fz="sm" flex="none" className={styles.link}>
      <Group gap={4} wrap="nowrap">
        <ArrowLineRightIcon weight="bold" className={styles.arrow} />
        {children}
      </Group>
    </Anchor>
  );
}

export default ArrowLink;
