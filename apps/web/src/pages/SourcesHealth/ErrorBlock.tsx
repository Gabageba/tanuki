import { ActionIcon, Box, Code, CopyButton, ScrollArea, Tooltip } from '@mantine/core';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  error: string;
};

/** Полный текст ошибки моноширинно, с копированием в углу; длинный — прокручивается. */
function ErrorBlock({ error }: Props) {
  const { t } = useTranslation();

  return (
    <Box pos="relative">
      <ScrollArea.Autosize mah={220} type="auto">
        <Code block fz={11} pr={40} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {error}
        </Code>
      </ScrollArea.Autosize>
      <CopyButton value={error} timeout={1200}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? t('copied') : t('copy')}>
            <ActionIcon
              variant="subtle"
              color={copied ? 'teal' : 'gray'}
              pos="absolute"
              top={6}
              right={6}
              onClick={copy}
            >
              {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Box>
  );
}

export default ErrorBlock;
