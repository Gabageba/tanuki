import { useEffect, useRef, type ReactNode } from 'react';
import { Box, ScrollArea } from '@mantine/core';
import { LIVE_FRAME_HEIGHT } from '../models';

type Props = {
  children: ReactNode;
  onBottomReached: () => void;
  /** Застывшее состояние низа сетки — открыть окно сразу внизу, где его видно. */
  startAtBottom?: boolean;
};

/** Окно прокрутки варианта: страница песочницы длинная, и бесконечная прокрутка всей страницы
 *  растягивала бы её. В приложении листается сама страница. */
function ScrollWindow({ children, onBottomReached, startAtBottom = false }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startAtBottom || !viewportRef.current) return;
    viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight });
  }, [startAtBottom]);

  return (
    <ScrollArea
      h={LIVE_FRAME_HEIGHT}
      viewportRef={viewportRef}
      offsetScrollbars
      onBottomReached={onBottomReached}
    >
      {/* Окно срезает всё за своим краем — без отступа срезалась бы подложка заголовка источника
          (S2: кнопка с `m={-6}`, в приложении ей хватает поля страницы). */}
      <Box px={6}>{children}</Box>
    </ScrollArea>
  );
}

export default ScrollWindow;
