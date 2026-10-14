import { Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  /** У сайта есть следующая порция блока — конец ещё не наступил. */
  hasNextPage: boolean;
};

/** Конец блока (E4): разделитель с подписью посередине — и у блока из одной порции, и у листаемого,
 *  когда порции кончились. */
function SectionEnd({ hasNextPage }: Props) {
  const { t } = useTranslation();

  if (hasNextPage) return null;

  return <Divider mt="lg" label={t('onlyTheseTitlesInBlock')} labelPosition="center" />;
}

export default SectionEnd;
