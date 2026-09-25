import type { Area } from 'react-easy-crop';
import { CROPPED_QUALITY, CROPPED_SIZE_PX } from './models';

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

/** Вырезает выбранную область в квадрат CROPPED_SIZE_PX. Safari не умеет webp в toBlob — там выйдет png. */
export const cropImage = async (src: string, area: Area) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = CROPPED_SIZE_PX;
  canvas.height = CROPPED_SIZE_PX;
  canvas
    .getContext('2d')
    ?.drawImage(
      image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      CROPPED_SIZE_PX,
      CROPPED_SIZE_PX,
    );

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/webp',
      CROPPED_QUALITY,
    ),
  );
};
