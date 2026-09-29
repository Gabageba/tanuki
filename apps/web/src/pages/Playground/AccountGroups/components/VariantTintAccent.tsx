import type { VariantProps } from '../models';
import VariantTint from './VariantTint';

/** H3a — H3, но «не привязан» подкрашен terracotta: шапка — призыв войти, а не серая строка. */
function VariantTintAccent({ state }: VariantProps) {
  return <VariantTint state={state} isAccentWhenUnlinked />;
}

export default VariantTintAccent;
