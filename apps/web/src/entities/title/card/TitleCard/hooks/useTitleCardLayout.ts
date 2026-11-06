import { useContext } from 'react';
import { TitleCardLayoutContext } from '../context';

function useTitleCardLayout() {
  const layout = useContext(TitleCardLayoutContext);
  if (!layout) throw new Error('TitleCard content must be rendered inside TitleCard');
  return layout;
}

export default useTitleCardLayout;
