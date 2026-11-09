import type { ReactNode } from 'react';
import { VIEW_MODE } from '@tanuki/contracts';
import { TitleCardLayoutContext } from '../context';
import { TITLE_CARD_LIST_SIZE, type TitleCardLayoutOptions } from '../models';

type Props = TitleCardLayoutOptions & {
  grid: ReactNode;
  list: ReactNode;
  coverless?: ReactNode;
};

function TitleCardLayout({
  viewMode = VIEW_MODE.GRID,
  listSize = TITLE_CARD_LIST_SIZE.REGULAR,
  coverless,
  grid,
  list,
}: Props) {
  const getCard = () => {
    switch (viewMode) {
      case VIEW_MODE.COVERLESS:
        return coverless;
      case VIEW_MODE.GRID:
        return grid;
      case VIEW_MODE.LIST:
        return list;
    }
  };

  return (
    <TitleCardLayoutContext.Provider value={{ viewMode, listSize }}>
      {getCard()}
    </TitleCardLayoutContext.Provider>
  );
}

export default TitleCardLayout;
