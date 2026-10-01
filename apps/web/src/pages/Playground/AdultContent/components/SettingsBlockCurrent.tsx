import { Switch } from '@mantine/core';
import { DropHalfIcon, EyeSlashIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import type { AdultSettings } from '../models';

type Props = {
  settings: AdultSettings;
  onChange: (patch: Partial<AdultSettings>) => void;
};

/** R0: две независимые строки с текстами из ru.json. */
function SettingsBlockCurrent({ settings, onChange }: Props) {
  return (
    <GroupedList label="Контент 18+">
      <GroupedList.Row
        icon={<EyeSlashIcon />}
        title="Источники 18+"
        description="выключено — источников с меткой 18+ нет в списке источников, поиске, настройках и входе в аккаунты"
        action={
          <Switch
            checked={settings.showAdultSources}
            onChange={(event) => onChange({ showAdultSources: event.currentTarget.checked })}
          />
        }
      />
      <GroupedList.Row
        icon={<DropHalfIcon />}
        title="Скрывать тайтлы 18+"
        description="в обычных источниках обложки таких тайтлов размыты, а их страницы не открываются"
        action={
          <Switch
            checked={settings.hideAdultTitles}
            onChange={(event) => onChange({ hideAdultTitles: event.currentTarget.checked })}
          />
        }
      />
    </GroupedList>
  );
}

export default SettingsBlockCurrent;
