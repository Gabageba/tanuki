import { useContext } from 'react';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { MOCK_RECENT } from '../mocks';
import { REMOVE_VISIBILITY } from '../models';
import RecentDropdownHeader from './RecentDropdownHeader';
import RecentRow from './RecentRow';

/** D1 — часы у пункта, крестик под курсором (на тач-экране всегда), «Очистить» в заголовке. */
function RecentDropdownHover() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <>
      <RecentDropdownHeader />
      {MOCK_RECENT.map((query) => (
        <RecentRow
          key={query}
          query={query}
          removeVisibility={isPhone ? REMOVE_VISIBILITY.ALWAYS : REMOVE_VISIBILITY.HOVER}
        />
      ))}
    </>
  );
}

export default RecentDropdownHover;
