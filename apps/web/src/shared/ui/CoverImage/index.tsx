import { Center, Image, Paper, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import styles from './CoverImage.module.scss';

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
};

function CoverImage({ src, alt, className }: Props) {
  const [isBroken, setIsBroken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const coverClassName = `${styles.cover}${className ? ' ' + className : ''}`;

  if (isBroken || !src) {
    return (
      <Paper h="100%">
        <Center className={coverClassName} c="dimmed">
          <ImageBrokenIcon size={38} />
        </Center>
      </Paper>
    );
  }

  return (
    <>
      {isLoading && <Skeleton className={coverClassName} pos="absolute" inset={0} />}
      <Image
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={coverClassName}
        style={isLoading ? { visibility: 'hidden' } : undefined}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsBroken(true)}
      />
    </>
  );
}

export default CoverImage;
