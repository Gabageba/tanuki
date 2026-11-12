import { Box, Group, Stack, Text, useMantineTheme } from '@mantine/core';
import { EMAIL_LAYOUT, type EmailLayout, type EmailRevision, type EmailScheme } from '../models';
import { EMAIL_SAMPLES } from '../mocks';
import { getEmailHtml, getEmailPalette } from '../lib';
import EmailPreview from './EmailPreview';

type Props = {
  code: string;
  layout: EmailLayout;
  revision: EmailRevision;
  scheme: EmailScheme;
  brandedFonts: boolean;
};

function VariantGallery({ code, layout, revision, scheme, brandedFonts }: Props) {
  const theme = useMantineTheme();
  const options = {
    layout,
    revision,
    scheme,
    brandedFonts,
    palette: getEmailPalette(theme, scheme),
  };
  const current = layout === EMAIL_LAYOUT.CURRENT;

  return (
    <Stack gap={40} mt="md">
      {EMAIL_SAMPLES.map((sample) => {
        const html = getEmailHtml(sample, options);
        return (
          <Stack key={sample.kind} gap="sm">
            <Box maw={1000}>
              <Text fw={600} fz="sm">
                {sample.name}
              </Text>
              <Text fz="sm" c="dimmed">
                Тема: {current ? sample.current.subject : sample.subject}
              </Text>
              {!current && (
                <Text fz="xs" c="dimmed">
                  Превью во входящих: {sample.preheader}
                </Text>
              )}
            </Box>
            <Group gap="lg" align="flex-start">
              <EmailPreview
                html={html}
                width={640}
                label="Компьютер · до 640 px"
                title={`${code} · ${sample.name} · компьютер`}
              />
              <EmailPreview
                html={html}
                width={375}
                label="Телефон · до 375 px"
                title={`${code} · ${sample.name} · телефон`}
              />
            </Group>
          </Stack>
        );
      })}
    </Stack>
  );
}

export default VariantGallery;
