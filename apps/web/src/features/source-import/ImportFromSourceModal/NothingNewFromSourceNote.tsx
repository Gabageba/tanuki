import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SourceImportFolder } from '@tanuki/contracts';
import { isSelectableFolder } from './lib';

type Props = {
  sourceTitle: string;
  folders: SourceImportFolder[];
};

/** «Нового нет» над папками — повторный импорт, где всё уже в закладках. */
function NothingNewFromSourceNote({ sourceTitle, folders }: Props) {
  const { t } = useTranslation();

  if (folders.length === 0 || folders.some(isSelectableFolder)) {
    return null;
  }

  return (
    <Text lh="tight" fz="sm">
      {t('nothingNewAllInBookmarks', { source: sourceTitle })}
    </Text>
  );
}

export default NothingNewFromSourceNote;
