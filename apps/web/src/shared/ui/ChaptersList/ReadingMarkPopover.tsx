import type { MouseEvent, ReactElement } from 'react';
import { NavLink, Popover, Stack } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import type { LinkedReadingMark } from '@/entities/title/models';
import LinkedReadingMarkNote from '@/entities/title/LinkedReadingMarkNote';
import { getReaderPath } from '@/entities/title/readingProgress';

type Props = {
  marks: LinkedReadingMark[];
  opened: boolean;
  onChange: (opened: boolean) => void;
  children: ReactElement;
};

/** Клик внутри выпадашки не должен дойти до ссылки строки: React-события всплывают сквозь
 *  портал так, будто выпадашка лежит внутри строки. Ссылку отметки это не ломает — она свой
 *  переход уже сделала, пока событие поднималось до выпадашки. */
const stopRowClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Откуда чужие отметки на этой главе и насколько им верить. Отметку открывают тапом, а не
 * наведением, — на мобилке иначе её не увидеть. Каждая отметка ведёт в читалку своего источника
 * на то место, где там остановились; источник не ответил — перейти некуда.
 */
function ReadingMarkPopover({ marks, opened, onChange, children }: Props) {
  const { t } = useTranslation();

  return (
    <Popover
      opened={opened}
      onChange={onChange}
      position="bottom-start"
      shadow="md"
      withArrow
      withinPortal
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown onClick={stopRowClick} maw={350} p={4}>
        <Stack gap={0}>
          {marks.map(({ progress, confidence }) => {
            const { titleId } = progress;
            const content = {
              label: <LinkedReadingMarkNote progress={progress} hideIcon />,
              description:
                confidence === READING_MARK_CONFIDENCE.APPROXIMATE && t('placeIsApproximate'),
            };

            return titleId ? (
              <NavLink
                key={progress.sourceId}
                component={Link}
                to={getReaderPath(titleId, progress.chapterId, progress.pageIndex)}
                rightSection={<CaretRightIcon size={14} />}
                {...content}
              />
            ) : (
              <NavLink key={progress.sourceId} disabled {...content} />
            );
          })}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export default ReadingMarkPopover;
