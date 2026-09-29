import type { VariantProps } from '../models';
import VariantTint from './VariantTint';

/** H3b — H3a, но фон шапки всегда серый: цвет состояния несут только иконка и заголовок. */
function VariantTintTitle({ state }: VariantProps) {
  return <VariantTint state={state} isAccentWhenUnlinked isGrayBackground />;
}

export default VariantTintTitle;
