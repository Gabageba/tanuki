import { Group, Paper, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowRightIcon, SparkleIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { DISCOVER_PATH, MOCK_HOME_ALL } from '../mocks';

/** V2b — плитка «Подборки», где вместо веера обложек — логотипы источников: сама плитка ведёт на
 *  страницу подборок, логотип — сразу в подборки своего сайта. Плитка не ссылка целиком: ссылки
 *  логотипов внутри другой ссылки недопустимы. */
function SelectionsLogosTile() {
  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="sm">
        <UnstyledButton component={Link} to={DISCOVER_PATH}>
          <Stack gap="xs">
            <ThemeIcon variant="light" size={40} radius="md">
              <SparkleIcon size={22} />
            </ThemeIcon>
            <Group gap={6} wrap="nowrap">
              <Text fw={600}>Подборки</Text>
              <ArrowRightIcon />
            </Group>
            <Text fz="sm" c="dimmed">
              Новинки, популярное и обновления с главных страниц сайтов
            </Text>
          </Stack>
        </UnstyledButton>
        <Group gap="xs">
          {MOCK_HOME_ALL.map(({ source }) => (
            <Tooltip key={source.id} label={`Подборки ${source.title}`}>
              <UnstyledButton
                component={Link}
                to={`${DISCOVER_PATH}/${source.id}`}
                aria-label={`Подборки ${source.title}`}
              >
                <SourceIcon id={source.id} title={source.title} size={32} />
              </UnstyledButton>
            </Tooltip>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
}

export default SelectionsLogosTile;
