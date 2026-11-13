import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Text } from '@mantine/core';

type Props = {
  html: string;
  title: string;
  width: number;
  label: string;
};

function EmailPreview({ html, title, width, label }: Props) {
  const [height, setHeight] = useState(400);
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => () => observer.current?.disconnect(), []);

  return (
    <Stack gap={6} w={width} maw="100%" miw={0}>
      <Text fz="xs" c="dimmed">
        {label}
      </Text>
      <Box
        component="iframe"
        title={title}
        srcDoc={html}
        sandbox="allow-same-origin"
        referrerPolicy="no-referrer"
        w="100%"
        h={height}
        display="block"
        style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 8 }}
        onLoad={(event) => {
          observer.current?.disconnect();
          const frameDocument = event.currentTarget.contentDocument;
          if (!frameDocument) {
            return;
          }
          const resize = () => {
            const bottom = frameDocument.body.getBoundingClientRect().bottom;
            const margin =
              Number.parseFloat(getComputedStyle(frameDocument.body).marginBottom) || 0;
            setHeight(Math.ceil(bottom + margin) + 2);
          };
          // Ссылки видны и выделяются, но макеты не запускают действия аккаунта.
          frameDocument.addEventListener('click', (clickEvent) => clickEvent.preventDefault());
          observer.current = new ResizeObserver(resize);
          observer.current.observe(frameDocument.body);
          resize();
        }}
      />
    </Stack>
  );
}

export default EmailPreview;
