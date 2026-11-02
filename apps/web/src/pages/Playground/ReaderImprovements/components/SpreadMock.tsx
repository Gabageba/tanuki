import { Flex, Image } from '@mantine/core';
import { SPREAD_ALIGN, type SpreadAlign } from '../models';
import pageOne from '../assets/page-one.webp';
import pageTwo from '../assets/page-two.webp';
import pageTwoShort from '../assets/page-two-short.webp';

type Props = {
  align: SpreadAlign;
  rtl?: boolean;
  single?: boolean;
  equal?: boolean;
  mobile?: boolean;
  background?: string;
  brightness?: number;
  vertical?: boolean;
  height?: number;
};
function SpreadMock({
  align,
  rtl = false,
  single = false,
  equal = false,
  mobile = false,
  background = 'black',
  brightness = 100,
  vertical = false,
  height,
}: Props) {
  const backgroundColor =
    background === 'gray'
      ? 'var(--mantine-color-gray-7)'
      : background === 'paper'
        ? 'var(--mantine-color-yellow-1)'
        : 'var(--mantine-color-dark-9)';
  const alignment =
    align === SPREAD_ALIGN.TOP
      ? 'flex-start'
      : align === SPREAD_ALIGN.BOTTOM
        ? 'flex-end'
        : 'center';
  return (
    <Flex
      bg={backgroundColor}
      h={height ?? (mobile ? 500 : 400)}
      align={alignment}
      justify="center"
      gap={0}
      direction={vertical ? 'column' : rtl ? 'row-reverse' : 'row'}
      style={{ overflow: 'hidden' }}
    >
      <Image
        src={pageOne}
        alt={single ? 'Последняя страница главы' : 'Страница 3'}
        h="auto"
        mah="100%"
        w="auto"
        maw={single || vertical ? '100%' : '50%'}
        fit="contain"
        style={{ filter: `brightness(${brightness}%)` }}
      />
      {!single && (
        <Image
          src={equal ? pageTwo : pageTwoShort}
          alt="Страница 4"
          h="auto"
          mah="100%"
          w="auto"
          maw="50%"
          fit="contain"
          style={{ filter: `brightness(${brightness}%)` }}
        />
      )}
    </Flex>
  );
}
export default SpreadMock;
