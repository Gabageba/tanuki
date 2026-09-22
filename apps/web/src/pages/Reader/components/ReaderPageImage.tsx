import { Center, Image, Paper, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import type { Page } from '@tanuki/contracts';
import { DEFAULT_PAGE_RATIO, READER_IMAGE_WIDTH_PROPS } from '../lib';
import styles from '../ReaderPage.module.scss';

type Props = {
  page: Page;
  alt: string;
};

function ReaderPageImage({ page, alt }: Props) {
  const [isBroken, setIsBroken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const ratio = page.width && page.height ? page.width / page.height : DEFAULT_PAGE_RATIO;

  if (isBroken) {
    return (
      <Paper style={{ aspectRatio: ratio }} {...READER_IMAGE_WIDTH_PROPS} radius={0}>
        <Center h="100%" c="dimmed">
          <ImageBrokenIcon size={38} />
        </Center>
      </Paper>
    );
  }

  return (
    <>
      {isLoading && (
        <Skeleton style={{ aspectRatio: ratio }} {...READER_IMAGE_WIDTH_PROPS} radius={0} />
      )}
      <Image
        radius={0}
        src={page.url}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        display="block"
        h="auto"
        pos={isLoading ? 'absolute' : undefined}
        hidden={isLoading}
        className={isLoading ? `${styles.page} ${styles.hidden}` : styles.page}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsBroken(true)}
        {...READER_IMAGE_WIDTH_PROPS}
      />
    </>
  );
}

export default ReaderPageImage;
