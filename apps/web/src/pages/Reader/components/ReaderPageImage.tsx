import { Button, Center, Image, Paper, Skeleton, Stack } from '@mantine/core';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowClockwiseIcon, ImageBrokenIcon } from '@phosphor-icons/react';
import type { Page } from '@tanuki/contracts';
import styles from '../ReaderPage.module.scss';

type Props = {
  page: Page;
  alt: string;
  brightness: number;
  onMeasure: (ratio: number) => void;
};

function ReaderPageImage({ page, alt, brightness, onMeasure }: Props) {
  const [isBroken, setIsBroken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);

  if (isBroken) {
    return (
      <Paper h="100%" radius={0}>
        <Center h="100%" c="dimmed">
          <Stack align="center" gap="sm">
            <ImageBrokenIcon size={38} />
            <Button
              variant="default"
              size="xs"
              leftSection={<ArrowClockwiseIcon />}
              onClick={() => {
                setIsBroken(false);
                setIsLoading(true);
                setAttempt((value) => value + 1);
              }}
            >
              {t('retry')}
            </Button>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <>
      {isLoading && <Skeleton pos="absolute" inset={0} radius={0} />}
      <Image
        key={attempt}
        ref={imgRef}
        radius={0}
        fit="contain"
        src={page.url}
        alt={alt}
        loading="eager"
        decoding="async"
        draggable={false}
        display="block"
        w="100%"
        h="100%"
        className={styles.page}
        style={{ filter: `brightness(${brightness}%)` }}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth && naturalHeight) onMeasure(naturalWidth / naturalHeight);
          setIsLoading(false);
        }}
        onError={() => setIsBroken(true)}
      />
    </>
  );
}

export default ReaderPageImage;
