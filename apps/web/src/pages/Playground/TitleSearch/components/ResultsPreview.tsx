import { FOUND_REMANGA } from '../mocks';
import { CARD_LAYOUT } from '../models';
import ResultCards from './ResultCards';
import SectionHeaderLink from './SectionHeaderLink';
import SourceSection from './SourceSection';

/** Кусок выдачи под фильтрами — одна секция, чтобы видеть, сколько места фильтры отнимают. */
function ResultsPreview() {
  const group = FOUND_REMANGA;

  return (
    <SourceSection header={<SectionHeaderLink source={group.source} />}>
      <ResultCards items={group.items} layout={CARD_LAYOUT.WRAP} />
    </SourceSection>
  );
}

export default ResultsPreview;
