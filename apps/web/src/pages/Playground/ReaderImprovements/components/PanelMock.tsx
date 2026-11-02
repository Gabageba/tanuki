import { useState, type ReactNode } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Image,
  Paper,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import {
  ArrowsInIcon,
  ArrowsOutIcon,
  ArrowLeftIcon,
  BookmarkSimpleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  FadersHorizontalIcon,
} from '@phosphor-icons/react';
import { PANEL_LAYOUT, type PanelLayout } from '../models';
import pageOne from '../assets/page-one.webp';

type Props = {
  layout: PanelLayout;
  mobile?: boolean;
  single?: boolean;
  page?: number;
  initiallyFullscreen?: boolean;
  children?: ReactNode;
  onSettings?: () => void;
};

function PanelMock({
  layout,
  mobile = false,
  single = false,
  page = 120,
  initiallyFullscreen = false,
  children,
  onSettings,
}: Props) {
  const [fullscreen, setFullscreen] = useState(initiallyFullscreen);
  const fullscreenButton = (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
      onClick={() => setFullscreen(!fullscreen)}
    >
      {fullscreen ? <ArrowsInIcon /> : <ArrowsOutIcon />}
    </ActionIcon>
  );
  const counter = (
    <Text ff="monospace" fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
      {single ? page : layout === PANEL_LAYOUT.CURRENT ? '3' : '3–4'} / 120
    </Text>
  );
  const controls = (
    <Group gap={4} wrap="nowrap">
      <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Предыдущая глава">
        <CaretLeftIcon />
      </ActionIcon>
      <Button variant="subtle" color="gray" miw={0} px="xs" maw={mobile ? 95 : 170}>
        <Text truncate>Глава 12: Долгий путь домой</Text>
      </Button>
      <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Следующая глава">
        <CaretRightIcon />
      </ActionIcon>
      <Divider orientation="vertical" h={26} />
      {!mobile && counter}
      <ActionIcon size="lg" variant="subtle" color="gray" aria-label="В закладки">
        <BookmarkSimpleIcon />
      </ActionIcon>
      <ActionIcon
        size="lg"
        variant="subtle"
        color="gray"
        aria-label="Настройки читалки"
        onClick={onSettings}
      >
        <FadersHorizontalIcon />
      </ActionIcon>
      {layout !== PANEL_LAYOUT.CURRENT &&
        (!mobile || layout === PANEL_LAYOUT.CONTROLS) &&
        fullscreenButton}
    </Group>
  );
  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Group p="xs" justify="space-between" wrap="nowrap">
        <Group gap="xs" miw={0} wrap="nowrap">
          <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Назад к тайтлу">
            <ArrowLeftIcon />
          </ActionIcon>
          <Stack gap={4} miw={0}>
            <Text fz="sm" fw={600} truncate>
              Очень длинное название тайтла
            </Text>
            <Text fz="xs" c="dimmed" truncate>
              Глава 12 из 120 · Источник
            </Text>
          </Stack>
        </Group>
        {mobile ? (
          <Group gap="xs" wrap="nowrap">
            {counter}
            {layout === PANEL_LAYOUT.HEADER && fullscreenButton}
          </Group>
        ) : (
          controls
        )}
      </Group>
      <Progress value={3} size={2} radius={0} />
      {!mobile && children}
      {mobile && (
        <Box pos="relative" h={320} bg="var(--mantine-color-dark-9)">
          {children ?? (
            <Image
              src={pageOne}
              alt="Страница главы"
              h="100%"
              w="auto"
              maw="100%"
              fit="contain"
              mx="auto"
            />
          )}
          <Paper
            withBorder
            p="xs"
            radius="md"
            maw="calc(100% - 32px)"
            w="fit-content"
            pos="absolute"
            bottom={16}
            left="50%"
            style={{ transform: 'translateX(-50%)' }}
          >
            {controls}
          </Paper>
        </Box>
      )}
    </Paper>
  );
}

export default PanelMock;
