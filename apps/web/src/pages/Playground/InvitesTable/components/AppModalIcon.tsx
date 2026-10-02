import {
  BroomIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  CropIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  FunnelXIcon,
  KeyIcon,
  LinkBreakIcon,
  LinkIcon,
  ProhibitIcon,
  SignInIcon,
  TicketIcon,
  TrashIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import { APP_MODAL, type AppModal } from '../models';

type Props = {
  modal: AppModal;
  size: number;
  color: string;
};

/** Иконка в заголовке модалки (M9): иконка главной кнопки, если она про смысл, иначе — предмет. */
function AppModalIcon({ modal, size, color }: Props) {
  const iconProps = { size, color, style: { flex: 'none' } };

  switch (modal) {
    case APP_MODAL.DELETE_OWN_ACCOUNT:
    case APP_MODAL.DELETE_USER:
      return <TrashIcon {...iconProps} />;
    case APP_MODAL.BLOCK:
      return <ProhibitIcon {...iconProps} />;
    case APP_MODAL.REVOKE_INVITE:
      return <LinkBreakIcon {...iconProps} />;
    case APP_MODAL.CLEAR_CACHE:
      return <BroomIcon {...iconProps} />;
    case APP_MODAL.RESET_FILTERS:
      return <FunnelXIcon {...iconProps} />;
    case APP_MODAL.AGE:
      return <EyeIcon {...iconProps} />;
    case APP_MODAL.NEW_INVITE:
      return <TicketIcon {...iconProps} />;
    case APP_MODAL.CHANGE_PASSWORD:
      return <KeyIcon {...iconProps} />;
    case APP_MODAL.CHANGE_EMAIL:
      return <EnvelopeSimpleIcon {...iconProps} />;
    case APP_MODAL.EXPORT_BOOKMARKS:
      return <DownloadSimpleIcon {...iconProps} />;
    case APP_MODAL.IMPORT_BOOKMARKS:
      return <UploadSimpleIcon {...iconProps} />;
    case APP_MODAL.IMPORT_FROM_SOURCE:
      return <CloudArrowDownIcon {...iconProps} />;
    case APP_MODAL.NEW_AVATAR:
      return <CropIcon {...iconProps} />;
    case APP_MODAL.ADD_TITLE_MANUALLY:
      return <LinkIcon {...iconProps} />;
    case APP_MODAL.SOURCE_LOGIN:
      return <SignInIcon {...iconProps} />;
    case APP_MODAL.INVITE_CREATED:
      return <CheckCircleIcon {...iconProps} />;
  }
}

export default AppModalIcon;
