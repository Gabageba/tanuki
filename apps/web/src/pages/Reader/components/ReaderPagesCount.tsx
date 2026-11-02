import type { TextProps } from '@mantine/core';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { isEmpty } from '@/shared/lib/isEmpty';

type Props = {
  page: number;
  pageEnd?: number;
  pagesLength?: number | null;
} & Omit<TextProps, 'fz' | 'c' | 'ff' | 'textWrap'>;

// Моноширинный, потому что это счётчик, а не фраза: цифра меняется на каждом развороте, и в
// пропорциональном шрифте соседние элементы шапки дёргались бы за ней.
function ReaderPagesCount({ page, pageEnd = page, pagesLength, ...restProps }: Props) {
  const { t } = useTranslation();

  if (isEmpty(pagesLength)) {
    return null;
  }

  return (
    <Text fz={12} c="dimmed" ff="monospace" textWrap="nowrap" {...restProps}>
      {t('pageOfTotalAbbrev', {
        page: pageEnd > page ? `${page}–${pageEnd}` : page,
        total: pagesLength,
      })}
    </Text>
  );
}

export default ReaderPagesCount;
