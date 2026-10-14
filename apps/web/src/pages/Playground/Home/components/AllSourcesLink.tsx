import { Anchor, Button, Group, Text } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowRightIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  /** A1 — кнопкой у заголовка страницы; иначе ссылкой со стрелкой, как «Каталог →». */
  asButton?: boolean;
  /** V3 — кнопка светлой акцентной заливкой, а не серой рамкой. */
  isLight?: boolean;
  /** V1, V3 — сколько источников всего: «Все источники · 23». */
  count?: number;
  /** V1 — кнопка во всю ширину блока. */
  fullWidth?: boolean;
};

/** «Все источники» — с главной в `/sources`. */
function AllSourcesLink({ asButton = false, isLight = false, count, fullWidth = false }: Props) {
  if (asButton) {
    return (
      <Button
        component={Link}
        to={ROUTE_PATHS.SOURCES}
        variant={isLight ? 'light' : 'default'}
        flex="none"
        fullWidth={fullWidth}
        leftSection={<SquaresFourIcon />}
      >
        Все источники
        {count !== undefined && (
          <Text span inherit ff="monospace" ml={6} opacity={0.7}>
            {count}
          </Text>
        )}
      </Button>
    );
  }

  return (
    <Anchor component={Link} to={ROUTE_PATHS.SOURCES} fz="sm" flex="none">
      <Group gap={4} wrap="nowrap">
        Все источники
        <ArrowRightIcon />
      </Group>
    </Anchor>
  );
}

export default AllSourcesLink;
