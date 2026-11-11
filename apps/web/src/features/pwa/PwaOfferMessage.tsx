import { useTranslation } from 'react-i18next';
import ToastAction from '@/shared/ui/Toast/ToastAction';
import { getPwaOffer } from './lib';
import type { PwaOffer } from './models';

type Props = {
  offer: PwaOffer;
  onConfirm: () => void;
};

function PwaOfferMessage({ offer, onConfirm }: Props) {
  const { t } = useTranslation();
  const { action, icon } = getPwaOffer(offer, t);

  return (
    <ToastAction icon={icon} onClick={onConfirm}>
      {action}
    </ToastAction>
  );
}

export default PwaOfferMessage;
