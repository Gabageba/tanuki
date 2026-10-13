import { Anchor, Badge, Box, Group, Menu, Text, Title, UnstyledButton } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { BooksIcon, CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import MidDot from '@/shared/ui/MidDot';
import { CATALOG_LINK, type CatalogLink } from '../models';
import styles from '../SelectionsTabs.module.scss';

type Props = {
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
  /** Ось C: C3 — ссылка во второй строке рядом с доменом, C4 — пункт внизу меню. */
  catalog: CatalogLink;
};

/**
 * S2 — заголовок источника (`SourceTitle`: логотип, название, домен) сам кнопка: по клику —
 * список источников подборок с логотипами, пункты как у остальных селектов — выбранный подсвечен
 * и с галочкой.
 */
function SourceTitleMenu({ sources, activeId, onChange, catalog }: Props) {
  const active = sources.find(({ id }) => id === activeId);
  if (!active) return null;
  const catalogPath = generatePath(ROUTE_PATHS.CATALOG, { sourceId: active.id });
  // C3: ссылка в каталог не может лежать внутри кнопки — кнопкой остаётся только строка
  // названия, домен со ссылкой — под ней, вне кнопки.
  const isSubtitleLink = catalog === CATALOG_LINK.SUBTITLE;

  const titleRow = (
    <Group gap={6} wrap="nowrap">
      <Title order={5} lineClamp={1}>
        {active.title}
      </Title>
      {active.isAdult && (
        <Badge color="red" ff="monospace" flex="none">
          18+
        </Badge>
      )}
      <CaretDownIcon size={16} style={{ flex: 'none' }} />
    </Group>
  );
  const domain = (
    <Text size="sm" c="dimmed" ff="monospace" truncate>
      {active.domain}
    </Text>
  );

  const dropdown = (
    <Menu.Dropdown mah={360} style={{ overflowY: 'auto' }}>
      {sources.map((source) => (
        <Menu.Item
          key={source.id}
          // Тот же вид, что у пунктов `Select`: выбранный — рамкой и заливкой акцента.
          className="selectable-option"
          data-checked={source.id === activeId || undefined}
          leftSection={<SourceIcon id={source.id} title={source.title} size={20} radius="sm" />}
          rightSection={
            source.id === activeId && <CheckIcon color="var(--mantine-primary-color-filled)" />
          }
          onClick={() => onChange(source.id)}
        >
          {source.title}
        </Menu.Item>
      ))}
      {catalog === CATALOG_LINK.MENU && (
        <>
          <Menu.Divider />
          <Menu.Item component={Link} to={catalogPath} leftSection={<BooksIcon size={20} />}>
            Каталог: {active.title}
          </Menu.Item>
        </>
      )}
    </Menu.Dropdown>
  );

  if (isSubtitleLink) {
    return (
      <Group gap="sm" wrap="nowrap" miw={0}>
        <SourceIcon id={active.id} title={active.title} flex="none" />
        <Box miw={0}>
          <Menu position="bottom-start" width={280} shadow="md">
            <Menu.Target>
              <UnstyledButton miw={0} maw="100%" aria-label="Сменить источник">
                {titleRow}
              </UnstyledButton>
            </Menu.Target>
            {dropdown}
          </Menu>
          <Group gap={6} wrap="nowrap" miw={0}>
            {domain}
            <MidDot c="dimmed" fz="sm" />
            <Anchor
              component={Link}
              to={catalogPath}
              fz="sm"
              underline="hover"
              className={styles.quietLink}
              flex="none"
            >
              Каталог
            </Anchor>
          </Group>
        </Box>
      </Group>
    );
  }

  return (
    <Menu position="bottom-start" width={280} shadow="md">
      <Menu.Target>
        <UnstyledButton miw={0} maw="100%" p={6} m={-6} bdrs="md" aria-label="Сменить источник">
          <Group gap="sm" wrap="nowrap">
            <SourceIcon id={active.id} title={active.title} flex="none" />
            <Box miw={0}>
              {titleRow}
              {domain}
            </Box>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      {dropdown}
    </Menu>
  );
}

export default SourceTitleMenu;
