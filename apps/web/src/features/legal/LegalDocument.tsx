import { Anchor, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  ADMIN_EMAIL,
  ADMIN_TELEGRAM_URL,
  ADMIN_TELEGRAM_USERNAME,
  DOCUMENT_REVISION,
} from './models';

type Props = {
  title: string;
  sections: { title: string; paragraphs: string[] }[];
  relatedDocument: { title: string; to: string };
};

function LegalDocument({ title, sections, relatedDocument }: Props) {
  const { t } = useTranslation();
  const { formatDateLong } = useDateFormat();

  return (
    <Stack component="article" gap="xl">
      <Stack gap="xs">
        <Title order={1} fz={24}>
          {title}
        </Title>
        <Text size="sm" c="dimmed">
          {t('revisionOf', { date: formatDateLong(`${DOCUMENT_REVISION}T00:00:00`) })}
        </Text>
      </Stack>

      {sections.map((section) => (
        <Stack component="section" key={section.title} gap="sm">
          <Title order={2} fz={20}>
            {section.title}
          </Title>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} size="sm" lh={1.7}>
              {paragraph}
            </Text>
          ))}
        </Stack>
      ))}

      <Stack component="section" gap="sm">
        <Title order={2} fz={20}>
          {t('contactAdministrator')}
        </Title>
        <Text size="sm" lh={1.7}>
          {t('contactAdministratorAboutDataOrContent')}
        </Text>
        <Group gap="md" wrap="wrap">
          <Anchor href={`mailto:${ADMIN_EMAIL}`} size="sm" ff="monospace">
            {ADMIN_EMAIL}
          </Anchor>
          <Anchor
            href={ADMIN_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            ff="monospace"
          >
            @{ADMIN_TELEGRAM_USERNAME}
          </Anchor>
        </Group>
      </Stack>

      <Divider />
      <Group component="nav" gap="md" justify="space-between">
        <Anchor component={Link} to={relatedDocument.to} size="sm">
          {relatedDocument.title}
        </Anchor>
        <Anchor component={Link} to={ROUTE_PATHS.LOGIN} size="sm">
          {t('backToLogin')}
        </Anchor>
      </Group>
    </Stack>
  );
}

export default LegalDocument;
