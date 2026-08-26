type CloseHandler = () => void;

const openDrawers = new Set<CloseHandler>();

export const registerDrawerClose = (onClose: CloseHandler) => {
  openDrawers.add(onClose);

  return () => {
    openDrawers.delete(onClose);
  };
};

export const closeAllDrawers = () => {
  openDrawers.forEach((onClose) => onClose());
};
