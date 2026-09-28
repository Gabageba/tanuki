import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { I18N } from '@/shared/lib/i18n';

type Props = {
  children: ReactNode;
};

function I18nProvider({ children }: Props) {
  return <I18nextProvider i18n={I18N}>{children}</I18nextProvider>;
}

export default I18nProvider;
