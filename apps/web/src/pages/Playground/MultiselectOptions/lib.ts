import { OPTION_FOCUS, OPTION_LOOK, type OptionFocus, type OptionLook } from './models';
import styles from './MultiselectOptions.module.scss';

const getLookClassName = (look: OptionLook) => {
  switch (look) {
    case OPTION_LOOK.CURRENT:
      return styles.lookCurrent;
    case OPTION_LOOK.GAP:
      return styles.lookGap;
    case OPTION_LOOK.MERGED:
      return styles.lookMerged;
    case OPTION_LOOK.FLAT:
      return styles.lookFlat;
    case OPTION_LOOK.CHECK:
      return styles.lookCheck;
  }
};

const getFocusClassName = (focus: OptionFocus) => {
  switch (focus) {
    case OPTION_FOCUS.CURRENT:
      return styles.focusCurrent;
    case OPTION_FOCUS.HOVER:
      return styles.focusHover;
    case OPTION_FOCUS.RING:
      return styles.focusRing;
  }
};

/** Класс пункта: база, вид выбранного (ось O) и вид фокуса (ось K). */
export const getOptionClassName = (look: OptionLook, focus: OptionFocus) =>
  [styles.option, getLookClassName(look), getFocusClassName(focus)].join(' ');

/** Класс списка: зазор между пунктами нужен только O1. */
export const getOptionsClassName = (look: OptionLook) => {
  switch (look) {
    case OPTION_LOOK.GAP:
      return styles.optionsGap;
    case OPTION_LOOK.CURRENT:
    case OPTION_LOOK.MERGED:
    case OPTION_LOOK.FLAT:
    case OPTION_LOOK.CHECK:
      return undefined;
  }
};
