import { Box, Button, Center, Image, Paper, Skeleton, Stack } from '@mantine/core';
import { useEffect, useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import type { Page, ReaderSettings } from '@tanuki/contracts';
import { DEFAULT_PAGE_RATIO, getReaderImageDimensionProps } from '../lib';
import styles from '../ReaderPage.module.scss';

type Props = {
  page: Page;
  /** Вместе с номером страницы уезжает в data-атрибуты обёртки: по ним наблюдатель понимает, какая
   *  страница сейчас под центром экрана. */
  chapterId: string;
  settings: ReaderSettings;
  hidden: boolean;
  /** Страница активной главы: грузится сразу, а не когда доскроллят до неё, — только на неё и
   *  переключается это чтение прямо сейчас. */
  eager: boolean;
  alt: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Обёртка у страницы настоящая, а не display: contents, — у элемента без бокса нет и пересечения,
 * а именно её наблюдает IntersectionObserver. Заодно размеры держит она, так что скелетон можно
 * просто положить поверх, не выдёргивая картинку из потока.
 *
 * Скрытая страница прячется через opacity + position: absolute, а не display: none: у последнего
 * нет рендер-бокса вообще, поэтому браузер не только не красит такую картинку, но и не
 * декодирует уже скачанные байты в растр. Но и opacity: 0 сам по себе не декодирует картинку
 * заранее — событие load сообщает лишь о конце скачивания, а сам разбор байт в растр браузер
 * всё равно откладывает до момента реального показа, из-за чего на один кадр мелькает пустота.
 * При перелистывании вперёд это всегда впервые показанная страница, поэтому заметно; при
 * листании назад страница уже была растеризована раньше. img.decode() ниже — API, который как
 * раз запускает это декодирование заранее, а не откладывает его до кадра показа.
 */
function ReaderPageImage({ page, chapterId, settings, hidden, eager, alt, ref }: Props) {
  const [isBroken, setIsBroken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Номер попытки — ключ <img>: повтор монтирует его заново, и браузер запрашивает страницу ещё
  // раз. Кэша у упавшего ответа нет (прокси ставит Cache-Control только на успешный), так что
  // адрес тот же.
  const [attempt, setAttempt] = useState(0);
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!eager) return;
    imgRef.current?.decode().catch(() => {});
  }, [eager, page.url, attempt]);
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
  // Пропорции держат место, пока настоящей высоты ещё нет. Как только картинка загрузилась, высоту
  // задаёт она сама: с неточным ratio страница иначе обрезалась бы или обрастала полями.
  const isPlaceholder = isLoading || isBroken;

  return (
    <Box
      ref={ref}
      data-chapter-id={chapterId}
      data-page-index={page.index}
      aria-hidden={hidden || undefined}
      pos={hidden ? 'absolute' : 'relative'}
      top={hidden ? 0 : undefined}
      left={hidden ? 0 : undefined}
      style={{
        aspectRatio: isPlaceholder ? ratio : undefined,
        opacity: hidden ? 0 : undefined,
        pointerEvents: hidden ? 'none' : undefined,
      }}
      {...dimensionProps}
    >
      {isBroken ? (
        <Paper h="100%" radius={0}>
          <Center h="100%" c="dimmed">
            <Stack align="center" gap="sm">
              <ImageBrokenIcon size={38} />
              <Button
                variant="default"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
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
      ) : (
        <>
          {isLoading && <Skeleton pos="absolute" inset={0} radius={0} />}
          <Image
            key={attempt}
            ref={imgRef}
            radius={0}
            fit="contain"
            src={page.url}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            display="block"
            w="100%"
            h="auto"
            className={styles.page}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalWidth && naturalHeight) {
                setRatio(naturalWidth / naturalHeight);
              }
              setIsLoading(false);
            }}
            onError={() => setIsBroken(true)}
          />
        </>
      )}
    </Box>
  );
}

export default ReaderPageImage;
