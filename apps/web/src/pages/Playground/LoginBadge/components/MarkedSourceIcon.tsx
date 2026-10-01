import { Indicator, Tooltip } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getMarkColor, getMarkLabel } from '../lib';
import { MARK_VIEW, type DemoSource, type LoginMark, type MarkView, type IconSet } from '../models';
import { getMarkIcon } from './lib';

type Props = {
  source: DemoSource;
  mark: LoginMark | null;
  view: MarkView;
  iconSet: IconSet;
};

/** Логотип источника; в L5 на его углу — кружок с пометкой о входе. */
function MarkedSourceIcon({ source, mark, view, iconSet }: Props) {
  const icon = <SourceIcon id={source.id} title={source.title} size={32} />;

  if (!mark || view !== MARK_VIEW.AVATAR) return icon;

  return (
    <Tooltip label={getMarkLabel(mark)}>
      <Indicator
        inline
        withBorder
        size={16}
        offset={3}
        position="bottom-end"
        color={getMarkColor(mark)}
        label={getMarkIcon(mark, 10, iconSet)}
        aria-label={getMarkLabel(mark)}
      >
        {icon}
      </Indicator>
    </Tooltip>
  );
}

export default MarkedSourceIcon;
