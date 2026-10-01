import { Switch } from '@mantine/core';
import { ImagesIcon, StackIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { BLUR_STYLE, type AdultSettings } from '../models';
import PreviewRow from './PreviewRow';

type Props = {
  settings: AdultSettings;
  onChange: (patch: Partial<AdultSettings>) => void;
  onReveal: (patch: Partial<AdultSettings>, reveals: string) => void;
};

/**
 * Итог: две независимые строки по объектам (F1b), обе всегда активны (R3 без блокировки), описания
 * говорят о текущем состоянии, последней строкой — превью обложек (P3) в стиле B1.
 */
function FinalSettingsBlock({ settings, onChange, onReveal }: Props) {
  return (
    <GroupedList label="Контент 18+">
      <GroupedList.Row
        icon={<ImagesIcon />}
        title="Тайтлы 18+ на обычных источниках"
        description={
          settings.hideAdultTitles
            ? 'Обложки размыты, страницы не открываются'
            : 'Показываются как обычно'
        }
        action={
          <Switch
            checked={!settings.hideAdultTitles}
            onChange={(event) =>
              event.currentTarget.checked
                ? onReveal(
                    { hideAdultTitles: false },
                    'тайтлы 18+ на обычных источниках без размытия',
                  )
                : onChange({ hideAdultTitles: true })
            }
          />
        }
      />
      <GroupedList.Row
        icon={<StackIcon />}
        title="Источники 18+"
        description={
          settings.showAdultSources
            ? 'Видны в списке источников и в поиске'
            : 'Скрыты из списка источников и поиска'
        }
        action={
          <Switch
            checked={settings.showAdultSources}
            onChange={(event) =>
              event.currentTarget.checked
                ? onReveal({ showAdultSources: true }, 'источники 18+')
                : onChange({ showAdultSources: false })
            }
          />
        }
      />
      <PreviewRow
        settings={settings}
        withDate={false}
        blurred={settings.hideAdultTitles}
        blurStyle={BLUR_STYLE.ICON}
      />
    </GroupedList>
  );
}

export default FinalSettingsBlock;
