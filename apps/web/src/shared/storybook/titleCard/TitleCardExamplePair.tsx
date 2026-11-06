import { VIEW_MODE } from '@tanuki/contracts';
import SkeletonCompare from '../SkeletonCompare';
import type { TitleCardExampleOptions } from './models';
import TitleCardExample from './TitleCardExample';

type Props = TitleCardExampleOptions;

function TitleCardExamplePair(props: Props) {
  const isList = props.viewMode === VIEW_MODE.LIST;

  return (
    <SkeletonCompare
      cols={{ base: 1, sm: 2 }}
      w={isList ? { base: 'calc(100vw - 32px)', sm: 520 } : 168}
      item={<TitleCardExample {...props} />}
      skeleton={<TitleCardExample {...props} skeleton />}
    />
  );
}

export default TitleCardExamplePair;
