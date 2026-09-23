import { Center, Image, Paper, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import type { Page, ReaderSettings } from '@tanuki/contracts';
import { DEFAULT_PAGE_RATIO, getReaderImageDimensionProps } from '../lib';
import styles from '../ReaderPage.module.scss';

type Props = {
  page: Page;
  settings: ReaderSettings;
  alt: string;
};

function ReaderPageImage({ page, settings, alt }: Props) {
  const [isBroken, setIsBroken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Источник отдаёт размеры не всегда, а в режиме «страница целиком» по ним считается ширина
  // страницы — ошибка в пропорциях там сразу видна пустыми полями вокруг страницы. Поэтому как
  // только картинка загрузилась, берём её настоящие пропорции.
  const [ratio, setRatio] = useState(
    page.width && page.height ? page.width / page.height : DEFAULT_PAGE_RATIO,
  );
  const dimensionProps = getReaderImageDimensionProps(
    settings.pageFit,
    settings.containerWidth,
    ratio,
  );

  if (isBroken) {
    return (
      <Paper style={{ aspectRatio: ratio }} {...dimensionProps} radius={0}>
        <Center h="100%" c="dimmed">
          <ImageBrokenIcon size={38} />
        </Center>
      </Paper>
    );
  }

  return (
    <>
      {isLoading && <Skeleton style={{ aspectRatio: ratio }} {...dimensionProps} radius={0} />}
      <Image
        radius={0}
        fit="contain"
        src={page.url}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        display="block"
        pos={isLoading ? 'absolute' : undefined}
        hidden={isLoading}
        className={isLoading ? `${styles.page} ${styles.hidden}` : styles.page}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth && naturalHeight) {
            setRatio(naturalWidth / naturalHeight);
          }
          setIsLoading(false);
        }}
        onError={() => setIsBroken(true)}
        {...dimensionProps}
      />
    </>
  );
}

export default ReaderPageImage;
