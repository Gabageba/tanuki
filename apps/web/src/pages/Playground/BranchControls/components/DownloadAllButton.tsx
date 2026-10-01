import { Button, type ButtonProps } from '@mantine/core';
import { DownloadSimpleIcon } from '@phosphor-icons/react';

type Props = {
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  /** false — как сейчас в приложении, без иконки в leftSection. */
  withIcon?: boolean;
};

function DownloadAllButton({ size, variant, withIcon = true }: Props) {
  return (
    <Button size={size} variant={variant} leftSection={withIcon && <DownloadSimpleIcon />}>
      Скачать все
    </Button>
  );
}

export default DownloadAllButton;
