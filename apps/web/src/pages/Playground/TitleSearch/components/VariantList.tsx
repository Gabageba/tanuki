import DemoSection from '../../components/DemoSection';
import type { Variant } from '../models';

type Props = {
  variants: Variant[];
};

/** Варианты одной оси подряд. */
function VariantList({ variants }: Props) {
  return variants.map(({ code, title, description, pros, cons, render }) => (
    <DemoSection
      key={code}
      code={code}
      title={title}
      description={description}
      pros={pros}
      cons={cons}
    >
      {render()}
    </DemoSection>
  ));
}

export default VariantList;
