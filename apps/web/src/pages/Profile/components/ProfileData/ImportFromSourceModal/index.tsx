import { useState } from 'react';
import { useTimeout } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { CloudArrowDownIcon } from '@phosphor-icons/react';
import useSources from '@/entities/source/hooks/useSources';
import useSourceAccounts from '../../ProfileSourceAccounts/hooks/useSourceAccounts';
import { groupSourcesByAccount } from '../../ProfileSourceAccounts/lib';
import ImportParsingStep from './ImportParsingStep';
import ImportSourceStep from './ImportSourceStep';
import ImportTitlesStep from './ImportTitlesStep';
import { MOCK_PARSING_DURATION_MS, SOURCE_IMPORT_STEP, type SourceImportStep } from './models';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  opened: boolean;
  onClose: () => void;
};

/**
 * Импорт закладок с источника: выбор источника, чтение закладок, выбор тайтлов — шаги одной модалки.
 * Заглушка: источники и аккаунты настоящие, а чтение закладок и список тайтлов — макет, импорт
 * ничего не сохраняет.
 */
function ImportFromSourceModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const { data: sources } = useSources();
  const { data: accounts } = useSourceAccounts();
  const [step, setStep] = useState<SourceImportStep>(SOURCE_IMPORT_STEP.SOURCE);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const parsing = useTimeout(() => setStep(SOURCE_IMPORT_STEP.TITLES), MOCK_PARSING_DURATION_MS);

  const families = groupSourcesByAccount(sources);
  const importableSources = families.flatMap((item) =>
    item.sources.filter((source) => source.isLoggedIn),
  );
  // Пока человек не выбрал сам, выбран первый источник, где вход выполнен; выбранный раньше
  // сбрасывается, если вход на нём пропал.
  const source =
    importableSources.find((item) => item.id === selectedSourceId) ?? importableSources[0];
  const sourceTitle = source?.title ?? '';

  const handleClose = () => {
    parsing.clear();
    onClose();
  };

  const handleSubmit = () => {
    setStep(SOURCE_IMPORT_STEP.PARSING);
    parsing.start();
  };

  const renderStep = () => {
    switch (step) {
      case SOURCE_IMPORT_STEP.SOURCE:
        return (
          <ImportSourceStep
            families={families}
            accounts={accounts?.items ?? []}
            sourceId={source?.id ?? null}
            onSourceChange={setSelectedSourceId}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        );
      case SOURCE_IMPORT_STEP.PARSING:
        return <ImportParsingStep sourceTitle={sourceTitle} onCancel={handleClose} />;
      case SOURCE_IMPORT_STEP.TITLES:
        return <ImportTitlesStep onClose={handleClose} />;
    }
  };

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={CloudArrowDownIcon}
      opened={opened}
      onClose={handleClose}
      // Шаг сбрасывается после анимации закрытия, иначе в закрывающейся модалке мелькает первый шаг.
      onExitTransitionEnd={() => setStep(SOURCE_IMPORT_STEP.SOURCE)}
      title={
        step === SOURCE_IMPORT_STEP.TITLES
          ? t('bookmarksOn', { source: sourceTitle })
          : t('importFromSource')
      }
      onBack={
        step === SOURCE_IMPORT_STEP.TITLES ? () => setStep(SOURCE_IMPORT_STEP.SOURCE) : undefined
      }
    >
      {renderStep()}
    </ToneModal>
  );
}

export default ImportFromSourceModal;
