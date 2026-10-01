import { Switch } from '@mantine/core';
import { DropHalfIcon, EyeIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getAllReveal, getTitlesReveal } from '../lib';
import { DESCRIPTION_MODE, type FramingRenderProps } from '../models';
import LockableRow from './LockableRow';
import PreviewRow from './PreviewRow';

type Props = FramingRenderProps;

/** F4: устройство R3 как есть, меняются только слова — зависимость названа прямо. */
function FramingTwoSwitches({ settings, term, mode, onChange, onReveal }: Props) {
  const isDynamic = mode === DESCRIPTION_MODE.DYNAMIC;
  const isLocked = settings.showAdultSources;

  const getMainDescription = () => {
    if (!isDynamic) return 'Выключено — скрыты только источники 18+';
    if (settings.showAdultSources) return 'Сейчас: видно всё';
    return `Сейчас: источники 18+ скрыты, ${term.inline} ${settings.hideAdultTitles ? 'размыты' : 'видны'}`;
  };

  const getBlurDescription = () => {
    if (isLocked) return 'Не действует, пока 18+ показывается';
    if (!isDynamic) return 'Пока 18+ выключен: обложки размыты, страницы не открываются';
    return settings.hideAdultTitles
      ? 'Обложки размыты, страницы не открываются'
      : 'Видны как обычно';
  };

  return (
    <GroupedList label="Контент 18+">
      <GroupedList.Row
        icon={<EyeIcon />}
        title="Показывать 18+"
        description={getMainDescription()}
        action={
          <Switch
            checked={settings.showAdultSources}
            onChange={(event) =>
              event.currentTarget.checked
                ? onReveal({ showAdultSources: true }, getAllReveal(term))
                : onChange({ showAdultSources: false })
            }
          />
        }
      />
      <LockableRow
        locked={isLocked}
        icon={<DropHalfIcon />}
        title={`Размывать ${term.inline}`}
        description={getBlurDescription()}
        action={
          <Switch
            checked={!isLocked && settings.hideAdultTitles}
            disabled={isLocked}
            onChange={(event) =>
              event.currentTarget.checked
                ? onChange({ hideAdultTitles: true })
                : onReveal({ hideAdultTitles: false }, getTitlesReveal(term))
            }
          />
        }
      />
      <PreviewRow settings={settings} withDate={false} />
    </GroupedList>
  );
}

export default FramingTwoSwitches;
