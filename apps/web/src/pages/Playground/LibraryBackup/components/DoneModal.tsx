import { CheckCircleIcon } from '@phosphor-icons/react';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';
import type { DoneView, RestoreResult } from '../models';
import DoneModalBody from './DoneModalBody';

type Props = {
  view: DoneView;
  result: RestoreResult;
  isPhone?: boolean;
};

/** Шаг «Готово» — тон `success`. */
function DoneModal({ view, result, isPhone = false }: Props) {
  return (
    <ModalFrame
      isPhone={isPhone}
      tone={MODAL_TONE.SUCCESS}
      icon={CheckCircleIcon}
      title="Библиотека восстановлена"
    >
      <DoneModalBody view={view} result={result} />
    </ModalFrame>
  );
}

export default DoneModal;
