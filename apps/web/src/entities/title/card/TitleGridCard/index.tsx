import { AspectRatio, Box, Group, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import TitleGridCardLink from './TitleGridCardLink';

type Props = {
  titleId: string;
  /** Обложка 3:4 — `TitleCardImage` или своя, как у закладки. */
  cover: ReactNode;
  /** Мета-строка над названием — `TitleCardMeta` в каталоге, «Гл. 12 · 2 дня назад» в
   *  «Продолжить чтение». */
  meta: ReactNode;
  name: ReactNode;
  /** Кнопка «⋯» на высоте мета-строки. Лежит поверх карточки, а не внутри: кнопка внутри
   *  ссылки недопустима. */
  actions?: ReactNode;
};

/** Карточка тайтла плиткой: обложка, мета-строка, название. Что в них — решает вызывающий. */
function TitleGridCard({ titleId, cover, meta, name, actions }: Props) {
  const card = (
    <TitleGridCardLink
      titleId={titleId}
      cover={cover}
      meta={meta}
      name={name}
      withActions={!!actions}
    />
  );

  if (!actions) {
    return card;
  }

  // Прозрачный слой повторяет обложку, чтобы кнопка встала ровно на мета-строку; клики сквозь
  // него доходят до ссылки, кроме самой кнопки.
  return (
    <Box pos="relative">
      {card}
      <Stack gap={8} pos="absolute" top={0} left={0} right={0} style={{ pointerEvents: 'none' }}>
        {/* Пропорцию `AspectRatio` задаёт ребёнку: пустой схлопнулся бы в ноль. */}
        <AspectRatio ratio={3 / 4}>
          <Box />
        </AspectRatio>
        {/* Шрифт и интервал как у мета-строки, чтобы `1lh` дал её высоту: кнопка садится на
            середину строки и выступает за неё, не раздвигая карточку. */}
        <Group
          h="1lh"
          fz="xs"
          lh="tight"
          w="fit-content"
          ml="auto"
          style={{ pointerEvents: 'auto' }}
        >
          {actions}
        </Group>
      </Stack>
    </Box>
  );
}

export default TitleGridCard;
