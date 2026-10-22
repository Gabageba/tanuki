import { COUNTERS_VIEW, type BackupPreview, type CountersView } from '../models';
import SummaryRows from './SummaryRows';
import SummaryTable from './SummaryTable';
import SummaryText from './SummaryText';

type Props = {
  view: CountersView;
  preview: BackupPreview;
};

/** S — счётчики сводки в выбранном виде. */
function SummaryCounters({ view, preview }: Props) {
  switch (view) {
    case COUNTERS_VIEW.ROWS:
      return <SummaryRows preview={preview} />;
    case COUNTERS_VIEW.TABLE:
      return <SummaryTable preview={preview} />;
    case COUNTERS_VIEW.TEXT:
      return <SummaryText preview={preview} />;
  }
}

export default SummaryCounters;
