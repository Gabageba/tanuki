import { useState } from 'react';
import { useTimeout } from '@mantine/hooks';
import { CloudArrowDownIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import {
  DEMO_FAMILIES,
  DEMO_FAMILY,
  IMPORT_STEP,
  type DemoFamilyKey,
  type ImportStep,
} from '../models';
import ImportSourceModal from './ImportSourceModal';
import ImportTitlesModal from './ImportTitlesModal';

/** Сколько макет изображает чтение закладок с источника. */
const PARSING_DURATION_MS = 2000;

/** Блок «Импорт и экспорт» вкладки «Данные» с новой строкой и двумя модалками импорта. */
function ImportDemo() {
  const [step, setStep] = useState<ImportStep>(IMPORT_STEP.CLOSED);
  const [family, setFamily] = useState<DemoFamilyKey>(DEMO_FAMILY.GROUPLE);
  const parsing = useTimeout(() => setStep(IMPORT_STEP.TITLES), PARSING_DURATION_MS);

  const handleClose = () => {
    parsing.clear();
    setStep(IMPORT_STEP.CLOSED);
  };

  const handleSubmit = () => {
    setStep(IMPORT_STEP.PARSING);
    parsing.start();
  };

  return (
    <>
      <GroupedList label="Импорт и экспорт">
        <GroupedList.Row
          icon={<UploadSimpleIcon />}
          title="Импорт из файла"
          description="Импорт не перезаписывает прогресс"
          actionProps={{ leftSection: <UploadSimpleIcon />, children: 'Импортировать' }}
        />
        <GroupedList.Row
          icon={<CloudArrowDownIcon />}
          title="Импорт из источника"
          description="Закладки из вашего аккаунта на источнике"
          actionProps={{
            leftSection: <CloudArrowDownIcon />,
            onClick: () => setStep(IMPORT_STEP.SOURCE),
            children: 'Импортировать',
          }}
        />
      </GroupedList>
      <ImportSourceModal
        opened={step === IMPORT_STEP.SOURCE || step === IMPORT_STEP.PARSING}
        isParsing={step === IMPORT_STEP.PARSING}
        family={family}
        onFamilyChange={setFamily}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
      <ImportTitlesModal
        opened={step === IMPORT_STEP.TITLES}
        familyTitle={DEMO_FAMILIES.find(({ key }) => key === family)?.title ?? ''}
        onBack={() => setStep(IMPORT_STEP.SOURCE)}
        onClose={handleClose}
      />
    </>
  );
}

export default ImportDemo;
