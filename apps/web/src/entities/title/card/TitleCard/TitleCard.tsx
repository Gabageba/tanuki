import TitleCardGrid from './components/TitleCardGrid/TitleCardGrid';
import TitleCardLayout from './components/TitleCardLayout';
import TitleCardList from './components/TitleCardList/TitleCardList';
import TitleCardActions from './components/TitleCardActions';
import type { TitleCardContent, TitleCardLayoutOptions } from './models';

type Props = TitleCardContent & TitleCardLayoutOptions;

function TitleCard({ viewMode, listSize, actions = [], ...restProps }: Props) {
  const actionsMenu = <TitleCardActions actions={actions} />;

  return (
    <TitleCardLayout
      viewMode={viewMode}
      listSize={listSize}
      grid={<TitleCardGrid {...restProps} actions={actionsMenu} />}
      list={<TitleCardList {...restProps} actions={actionsMenu} />}
    />
  );
}

export default TitleCard;
