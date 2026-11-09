import { TITLE_TAG_HEIGHT } from '@/entities/title/markers/models';
import {
  FOLDER_MARK,
  FOLDER_MARK_APPEARANCE,
  type FolderMark,
  type FolderMarkAppearance,
} from './models';

export const getFolderDecorationSize = (appearance: FolderMarkAppearance) => {
  switch (appearance) {
    case FOLDER_MARK_APPEARANCE.SQUARE:
      return 22;
    case FOLDER_MARK_APPEARANCE.TAG:
      return TITLE_TAG_HEIGHT;
  }
};

export const getFolderPresentation = (mark: FolderMark) => {
  switch (mark) {
    case FOLDER_MARK.HEADING_ICON:
      return { inHeading: true, withName: false };
    case FOLDER_MARK.HEADING_NAME:
      return { inHeading: true, withName: true };
    case FOLDER_MARK.META_ICON:
      return { inHeading: false, withName: false };
    case FOLDER_MARK.META_NAME:
      return { inHeading: false, withName: true };
  }
};
