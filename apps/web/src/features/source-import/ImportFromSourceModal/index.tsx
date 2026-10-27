import { useRef, useState } from 'react';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { CheckCircleIcon, CloudArrowDownIcon } from '@phosphor-icons/react';
import type { SourceImportPreview, SourceImportResult } from '@tanuki/contracts';
import useSourceAccounts from '@/entities/source-account/hooks/useSourceAccounts';
import { groupSourcesByAccount } from '@/entities/source-account/lib';
import useSources from '@/entities/source/hooks/useSources';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import useSourceImport from './hooks/useSourceImport';
import useSourceImportPreview from './hooks/useSourceImportPreview';
import ImportDoneStep from './ImportDoneStep';
import ImportFoldersStep from './ImportFoldersStep';
import ImportParsingStep from './ImportParsingStep';
import ImportQuestionsStep from './ImportQuestionsStep';
import ImportSourceStep from './ImportSourceStep';
import { getDefaultFolderIds, isImportableSource, sortImportableFamiliesFirst } from './lib';
import {
  DEFAULT_IMPORT_CHOICES,
  SOURCE_IMPORT_STEP,
  type ImportChoices,
  type SourceImportStep,
} from './models';

type Props = {
  opened: boolean;
  onClose: () => void;
};

/**
 * Импорт закладок с сайта: источник → чтение → папки → вопросы (только при конфликтах) → готово.
 * До «Импорт» ничего не пишется — закрыть можно на любом шаге. Ошибки сервера показывает
 * глобальный обработчик; ошибка чтения возвращает на выбор источника.
 */
function ImportFromSourceModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: sources } = useSources();
  const { data: accounts } = useSourceAccounts();
  const [step, setStep] = useState<SourceImportStep>(SOURCE_IMPORT_STEP.SOURCE);
  // Источник, который читается или уже прочитан; после чтения — тот, по которому строилась сводка.
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [preview, setPreview] = useState<SourceImportPreview | null>(null);
  const [result, setResult] = useState<SourceImportResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const choices = useForm<ImportChoices>({
    initialValues: DEFAULT_IMPORT_CHOICES,
    validate: {
      folderIds: (value) => (value.length === 0 ? t('chooseAtLeastOneFolder') : null),
    },
  });
  const previewMutation = useSourceImportPreview();
  const importMutation = useSourceImport();
  const isDone = step === SOURCE_IMPORT_STEP.DONE;

  const families = sortImportableFamiliesFirst(groupSourcesByAccount(sources));
  const importableIds = families.flatMap((item) =>
    item.sources.filter(isImportableSource).map(({ id }) => id),
  );
  // Название — из полного списка: вход, пропавший после чтения, заголовок не меняет.
  const sourceTitle =
    families.flatMap((item) => item.sources).find(({ id }) => id === sourceId)?.title ?? '';

  const handleFindBookmarks = (id: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setSourceId(id);
    setStep(SOURCE_IMPORT_STEP.PARSING);
    previewMutation.mutate(
      { sourceId: id, signal: controller.signal },
      {
        onSuccess: (data) => {
          if (!data) return;
          setPreview(data);
          choices.setValues({ ...DEFAULT_IMPORT_CHOICES, folderIds: getDefaultFolderIds(data) });
          setStep(SOURCE_IMPORT_STEP.FOLDERS);
        },
        onError: () => setStep(SOURCE_IMPORT_STEP.SOURCE),
      },
    );
  };

  // Источник — тот, по которому строилась сводка: id папок имеют смысл только на нём.
  const handleImport = (values: ImportChoices) => {
    if (!preview) return;
    importMutation.mutate(
      { sourceId: preview.sourceId, ...values },
      {
        onSuccess: (data) => {
          setResult(data);
          setStep(SOURCE_IMPORT_STEP.DONE);
        },
      },
    );
  };

  const handleOpenBookmarks = () => {
    handleClose();
    void navigate(ROUTE_PATHS.BOOKMARKS);
  };

  const getBack = () => {
    switch (step) {
      case SOURCE_IMPORT_STEP.FOLDERS:
        return () => setStep(SOURCE_IMPORT_STEP.SOURCE);
      case SOURCE_IMPORT_STEP.QUESTIONS:
        return () => setStep(SOURCE_IMPORT_STEP.FOLDERS);
      case SOURCE_IMPORT_STEP.SOURCE:
      case SOURCE_IMPORT_STEP.PARSING:
      case SOURCE_IMPORT_STEP.DONE:
        return undefined;
    }
  };

  const getTitle = () => {
    switch (step) {
      case SOURCE_IMPORT_STEP.SOURCE:
      case SOURCE_IMPORT_STEP.PARSING:
        return t('importFromSource');
      case SOURCE_IMPORT_STEP.FOLDERS:
      case SOURCE_IMPORT_STEP.QUESTIONS:
        return t('bookmarksOn', { source: sourceTitle });
      case SOURCE_IMPORT_STEP.DONE:
        return t('bookmarksImported');
    }
  };

  // Чтение рвётся, а сброс мутаций отцепляет их `onSuccess` сразу при закрытии: ответ, пришедший
  // позже, шаг уже не переключит.
  const handleClose = () => {
    abortRef.current?.abort();
    previewMutation.reset();
    importMutation.reset();
    onClose();
  };

  // Всё сбрасывается после анимации закрытия, иначе в закрывающейся модалке мелькает первый шаг.
  const reset = () => {
    setStep(SOURCE_IMPORT_STEP.SOURCE);
    setSourceId(null);
    setPreview(null);
    setResult(null);
    choices.reset();
  };

  return (
    <ToneModal
      tone={isDone ? MODAL_TONE.SUCCESS : MODAL_TONE.NEUTRAL}
      icon={isDone ? CheckCircleIcon : CloudArrowDownIcon}
      opened={opened}
      onClose={handleClose}
      onExitTransitionEnd={reset}
      title={getTitle()}
      onBack={getBack()}
    >
      {step === SOURCE_IMPORT_STEP.SOURCE && (
        <ImportSourceStep
          families={families}
          accounts={accounts?.items ?? []}
          importableIds={importableIds}
          initialSourceId={sourceId}
          onSubmit={handleFindBookmarks}
          onCancel={handleClose}
        />
      )}
      {step === SOURCE_IMPORT_STEP.PARSING && (
        <ImportParsingStep sourceTitle={sourceTitle} onCancel={handleClose} />
      )}
      {step === SOURCE_IMPORT_STEP.FOLDERS && preview && (
        <ImportFoldersStep
          sourceTitle={sourceTitle}
          preview={preview}
          form={choices}
          isImporting={importMutation.isPending}
          onNext={() => setStep(SOURCE_IMPORT_STEP.QUESTIONS)}
          onImport={handleImport}
          onBack={() => setStep(SOURCE_IMPORT_STEP.SOURCE)}
          onCancel={handleClose}
        />
      )}
      {step === SOURCE_IMPORT_STEP.QUESTIONS && preview && (
        <ImportQuestionsStep
          preview={preview}
          form={choices}
          isImporting={importMutation.isPending}
          onImport={handleImport}
          onCancel={handleClose}
        />
      )}
      {isDone && result && (
        <ImportDoneStep
          sourceTitle={sourceTitle}
          result={result}
          onClose={handleClose}
          onOpenBookmarks={handleOpenBookmarks}
        />
      )}
    </ToneModal>
  );
}

export default ImportFromSourceModal;
