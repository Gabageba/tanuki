import { Switch } from '@mantine/core';
import { EyeIcon, ImagesIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getAllReveal, getTitlesReveal } from '../lib';
import { DESCRIPTION_MODE, type FramingRenderProps } from '../models';
import LockableRow from './LockableRow';
import PreviewRow from './PreviewRow';

type Props = FramingRenderProps;

/**
 * F2: «Показывать 18+» и исключение из выключенного — «Но показывать тайтлы». Обе строки в одной
 * полярности, поэтому при включённом 18+ исключение честно стоит включённым.
 */
function FramingException({ settings, term, mode, onChange, onReveal }: Props) {
  const isDynamic = mode === DESCRIPTION_MODE.DYNAMIC;
  const isLocked = settings.showAdultSources;
  const areTitlesShown = isLocked || !settings.hideAdultTitles;

  const getMainDescription = () => {
    if (!isDynamic) return 'Выключено — скрыты только источники 18+';
    if (settings.showAdultSources) return 'Видно всё, без размытия';
    return `Источники 18+ скрыты, ${term.inline} ${areTitlesShown ? 'видны' : 'размыты'}`;
  };

  const getExceptionDescription = () => {
    if (isLocked) return 'Уже показываются — 18+ включён';
    if (!isDynamic) return 'Без размытия, хотя источники 18+ скрыты';
    return areTitlesShown ? 'Видны как обычно' : 'Обложки размыты, страницы не открываются';
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
        icon={<ImagesIcon />}
        title={`Но показывать ${term.inline}`}
        description={getExceptionDescription()}
        action={
          <Switch
            checked={areTitlesShown}
            disabled={isLocked}
            onChange={(event) =>
              event.currentTarget.checked
                ? onReveal({ hideAdultTitles: false }, getTitlesReveal(term))
                : onChange({ hideAdultTitles: true })
            }
          />
        }
      />
      <PreviewRow settings={settings} withDate={false} />
    </GroupedList>
  );
}

export default FramingException;
