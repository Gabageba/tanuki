import GroupedList from '@/shared/ui/GroupedList';
import { DEMO_SOURCES, type MarkPlacement } from '../models';
import SettingsSourceRow from './SettingsSourceRow';

type Props = {
  placement: MarkPlacement;
};

/** «Настройки → Источники»: один плоский список — порядок, включение и пометки о входе. */
function SettingsSourcesDemo({ placement }: Props) {
  return (
    <GroupedList label="Порядок и видимость">
      {DEMO_SOURCES.map((source) => (
        <SettingsSourceRow key={source.id} source={source} placement={placement} />
      ))}
    </GroupedList>
  );
}

export default SettingsSourcesDemo;
