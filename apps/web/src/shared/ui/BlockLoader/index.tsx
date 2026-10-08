import { Center, Loader, type MantineStyleProps } from '@mantine/core';
import styles from './BlockLoader.module.scss';

type Props = {
  /** Высота места под блок: пока ответа нет, страница под ним не подпрыгивает. */
  mih?: MantineStyleProps['mih'];
};

/**
 * Загрузка блока, у которого ответ может оказаться пустым (закладки, приглашения, поиск), — там
 * скелетон из карточек сменился бы одиноким пустым состоянием. Место под блок держится сразу, а сам
 * спиннер проявляется с задержкой: на быстром ответе он не мелькает вовсе.
 */
function BlockLoader({ mih = 240 }: Props) {
  return (
    <Center mih={mih}>
      <Loader className={styles.loader} />
    </Center>
  );
}

export default BlockLoader;
