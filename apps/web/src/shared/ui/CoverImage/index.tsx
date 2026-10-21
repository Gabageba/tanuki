import type { ImageProps } from '@mantine/core';
import { Center, Image, Paper, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { ImageBrokenIcon, ImageIcon } from '@phosphor-icons/react';
import styles from './CoverImage.module.scss';

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fit?: ImageProps['fit'];
};

function CoverImage({ src, alt, className, fit = 'cover' }: Props) {
  const [isBroken, setIsBroken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const coverClassName = `${styles.cover}${className ? ' ' + className : ''}`;

  if (isBroken || !src) {
    return (
      <Paper className={`${coverClassName} ${styles.placeholder}`}>
        <Center h="100%" c="dimmed">
          {/* Обложки нет у источника — просто картинка; ссылка есть, но не открылась — битая. */}
          {src ? <ImageBrokenIcon size={38} /> : <ImageIcon size={38} />}
        </Center>
      </Paper>
    );
  }

  return (
    <>
      {isLoading && <Skeleton className={`${coverClassName} ${styles.placeholder}`} />}
      <Image
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        fit={fit}
        className={isLoading ? `${coverClassName} ${styles.hidden}` : coverClassName}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsBroken(true)}
      />
    </>
  );
}

export default CoverImage;
