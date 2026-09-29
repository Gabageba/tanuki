import type { CSSProperties } from 'react';
import { DEMO_SOURCES, type AccountState } from '../../AccountGroups/models';
import DemoGroup from '../../AccountGroups/components/DemoGroup';
import DemoSourceRow from '../../AccountGroups/components/DemoSourceRow';
import DemoHeader from './DemoHeader';

type Props = {
  state: AccountState;
  bg?: string;
  style?: CSSProperties;
};

/** B0–B3 — шапка остаётся первой строкой рамки, меняется только её оформление. */
function VariantInFrame({ state, bg, style }: Props) {
  return (
    <DemoGroup>
      <DemoHeader state={state} bg={bg} style={style} />
      {DEMO_SOURCES.map((source) => (
        <DemoSourceRow key={source.id} source={source} />
      ))}
    </DemoGroup>
  );
}

export default VariantInFrame;
