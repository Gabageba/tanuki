import { useEffect } from 'react';
import { READER_DIRECTION, READER_READING_MODE, type ReaderSettings } from '@tanuki/contracts';
import { getSpreadStart, isReaderInteractionBlocked } from '../navigation';
import type { ReaderFeedChapter, ReaderPosition } from '../models';

type Params = {
  settings: ReaderSettings;
  activeChapter: ReaderFeedChapter | undefined;
  pageStep: number;
  goNext: () => void;
  goPrev: () => void;
  goToPosition: (position: ReaderPosition) => void;
  changeMode: () => void;
  fullscreenSupported: boolean;
  toggleFullscreen: () => Promise<void>;
};

function useReaderKeyboard({
  settings,
  activeChapter,
  pageStep,
  goNext,
  goPrev,
  goToPosition,
  changeMode,
  fullscreenSupported,
  toggleFullscreen,
}: Params) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.repeat ||
        isReaderInteractionBlocked(event)
      )
        return;
      const horizontal = settings.readingMode === READER_READING_MODE.HORIZONTAL;
      const rtl = settings.direction === READER_DIRECTION.RTL;
      switch (event.key.toLowerCase()) {
        case 'arrowright':
        case 'arrowleft':
          if (!horizontal || event.shiftKey) return;
          event.preventDefault();
          if ((event.key === 'ArrowRight') !== rtl) goNext();
          else goPrev();
          break;
        case ' ':
          event.preventDefault();
          if (horizontal) {
            if (event.shiftKey) goPrev();
            else goNext();
          } else {
            window.scrollBy({
              top: window.innerHeight * (event.shiftKey ? -0.9 : 0.9),
              behavior: 'smooth',
            });
          }
          break;
        case 'home':
        case 'end':
          if (event.shiftKey || !activeChapter?.pages.length) return;
          event.preventDefault();
          goToPosition({
            chapterId: activeChapter.chapterId,
            pageIndex:
              event.key === 'Home' ? 0 : getSpreadStart(activeChapter.pages.length - 1, pageStep),
          });
          break;
        case 'm':
          if (event.shiftKey) return;
          event.preventDefault();
          changeMode();
          break;
        case 'f':
          if (event.shiftKey || !fullscreenSupported) return;
          event.preventDefault();
          void toggleFullscreen();
      }
    };
    // Handle navigation before the scroll pin's bubble listener releases its state. Otherwise
    // that update can replace this listener during the very event that should change mode.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    settings.readingMode,
    settings.direction,
    activeChapter,
    pageStep,
    goNext,
    goPrev,
    goToPosition,
    changeMode,
    fullscreenSupported,
    toggleFullscreen,
  ]);
}

export default useReaderKeyboard;
