import { Switch } from '@mantine/core';
import { ImagesIcon, StackIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getAllReveal, getTitlesReveal } from '../lib';
import { DESCRIPTION_MODE, type FramingRenderProps } from '../models';
import LockableRow from './LockableRow';
import PreviewRow from './PreviewRow';

type Props = FramingRenderProps;

/**
 * F1: строки названы по тому, чем управляют. Тумблеры «показывающие»: выключенные тайтлы
 * размыты. Источники 18+ включают тайтлы с собой — строка тайтлов тогда заблокирована включённой.
 */
function FramingObjects({ settings, term, mode, onChange, onReveal }: Props) {
  const isDynamic = mode === DESCRIPTION_MODE.DYNAMIC;
  const isLocked = settings.showAdultSources;
  const areTitlesShown = isLocked || !settings.hideAdultTitles;

  const getTitlesDescription = () => {
    if (isLocked) return 'Показываются вместе с источниками 18+';
    if (!isDynamic) return 'Выключено — обложки размыты, страницы не открываются';
    return areTitlesShown ? 'Показываются как обычно' : 'Обложки размыты, страницы не открываются';
  };

  const getSourcesDescription = () => {
    if (!isDynamic) return `Сайты, где всё 18+. Включено — ${term.inline} видны тоже`;
    return settings.showAdultSources
      ? 'Видны в списке источников и в поиске'
      : 'Скрыты из списка источников и поиска';
  };

  return (
    <GroupedList label="Контент 18+">
      <LockableRow
        locked={isLocked}
        icon={<ImagesIcon />}
        title={term.title}
        description={getTitlesDescription()}
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
      <GroupedList.Row
        icon={<StackIcon />}
        title="Источники 18+"
        description={getSourcesDescription()}
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
      <PreviewRow settings={settings} withDate={false} />
    </GroupedList>
  );
}

export default FramingObjects;
