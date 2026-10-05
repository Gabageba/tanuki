import { EmptyState } from '@mantine/core';
import { TicketIcon } from '@phosphor-icons/react';

/** Ни одного приглашения ещё не выпускали. */
function InvitesEmpty() {
  return (
    <EmptyState
      title="Приглашений пока нет"
      description="Создайте приглашение, чтобы позвать кого-нибудь"
      icon={<TicketIcon />}
    />
  );
}

export default InvitesEmpty;
