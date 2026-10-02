import type { InviteSort, MockInvite, PanelConfig, SortState } from '../models';
import { TABLE_LAYOUT } from '../models';
import InvitesTableCurrent from './InvitesTableCurrent';
import InvitesTableMerged from './InvitesTableMerged';
import InvitesTableOutcome from './InvitesTableOutcome';
import InvitesTableSeparate from './InvitesTableSeparate';

type Props = {
  invites: MockInvite[];
  config: PanelConfig;
  selfName: string;
  sortState: SortState;
  onSortChange: (sort: InviteSort) => void;
  onOpen: (invite: MockInvite) => void;
  onRevoke: (id: string) => void;
};

/** Таблица в раскладке выбранного варианта T. */
function InvitesList({
  invites,
  config,
  selfName,
  sortState,
  onSortChange,
  onOpen,
  onRevoke,
}: Props) {
  const tableProps = { invites, sortState, onSortChange, onOpen };

  switch (config.table) {
    case TABLE_LAYOUT.CURRENT:
      return <InvitesTableCurrent invites={invites} onRevoke={onRevoke} />;
    case TABLE_LAYOUT.SEPARATE:
      return <InvitesTableSeparate {...tableProps} />;
    case TABLE_LAYOUT.MERGED:
      return <InvitesTableMerged {...tableProps} selfName={selfName} />;
    case TABLE_LAYOUT.OUTCOME:
      return <InvitesTableOutcome {...tableProps} outcome={config.outcome} />;
  }
}

export default InvitesList;
