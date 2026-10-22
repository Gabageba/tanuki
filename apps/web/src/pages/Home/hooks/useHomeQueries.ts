import useContinueReading from './useContinueReading';
import useNewChapterBookmarks from './useNewChapterBookmarks';

/** Запросы страницы для PageLayout: блоки «моего» грузятся сами, а упади оба разом — это ошибка
 *  сервера, и вместо пустых блоков страница показывает её. */
function useHomeQueries() {
  return {
    continueReading: useContinueReading(),
    newChapterBookmarks: useNewChapterBookmarks(),
  };
}

export default useHomeQueries;
