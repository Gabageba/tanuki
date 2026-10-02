import { USER_ROLE } from '@tanuki/contracts';
import {
  ACTIONS_MODE,
  BLOCK_FORM,
  DELETE_CONFIRM,
  FILTERS_LAYOUT,
  MOBILE_LAYOUT,
  STAFF_ROLE,
  TABLE_LAYOUT,
  USER_STATUS,
  type MockUser,
  type PanelConfig,
  type StaffRole,
} from './models';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const daysAhead = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const ADMIN_ID = 'u-admin';
const MODERATOR_ID = 'u-kitsune';

/** Строка «Вы» — тот, кем сейчас смотрим. */
export const getSelfId = (viewer: StaffRole) => {
  switch (viewer) {
    case STAFF_ROLE.ADMIN:
      return ADMIN_ID;
    case STAFF_ROLE.MODERATOR:
      return MODERATOR_ID;
  }
};

const activeUser = (
  id: string,
  username: string,
  invitedBy: string | null,
  createdDaysAgo: number,
  lastSeenHoursAgo: number | null,
): MockUser => ({
  id,
  username,
  email: `${username.replace('.', '')}@mail.example`,
  role: USER_ROLE.USER,
  status: USER_STATUS.ACTIVE,
  blockedUntil: null,
  blockReason: null,
  deletionScheduledAt: null,
  invitedBy,
  createdAt: daysAgo(createdDaysAgo),
  lastSeenAt: lastSeenHoursAgo === null ? null : hoursAgo(lastSeenHoursAgo),
});

/** 23 человека — три страницы по десять; все состояния, роли и крайние случаи — на первой. */
export const MOCK_USERS: MockUser[] = [
  {
    ...activeUser(ADMIN_ID, 'tanuki_admin', null, 330, 0.2),
    role: USER_ROLE.ADMIN,
    email: 'admin@tanuki.example',
  },
  { ...activeUser(MODERATOR_ID, 'kitsune_mod', 'tanuki_admin', 300, 1), role: USER_ROLE.MODERATOR },
  { ...activeUser('u-owl', 'night_owl', 'tanuki_admin', 210, 30), role: USER_ROLE.MODERATOR },
  activeUser('u-pavel', 'pavel_reader', 'kitsune_mod', 120, 3),
  activeUser('u-long', 'manga_enjoyer_from_tokyo', 'night_owl', 95, 50),
  { ...activeUser('u-marina', 'marina.k', 'kitsune_mod', 2, null), status: USER_STATUS.UNVERIFIED },
  {
    ...activeUser('u-spam', 'spam_bot_42', 'kitsune_mod', 40, 400),
    status: USER_STATUS.BLOCKED,
    blockReason: 'Спам ссылками на сторонние сайты в отзывах к тайтлам',
  },
  {
    ...activeUser('u-grumpy', 'grumpy_cat', 'night_owl', 75, 130),
    status: USER_STATUS.BLOCKED,
    blockedUntil: daysAhead(5),
  },
  {
    ...activeUser('u-leaving', 'leaving_soon', 'tanuki_admin', 180, 72),
    status: USER_STATUS.DELETION_SCHEDULED,
    deletionScheduledAt: daysAhead(12),
  },
  activeUser('u-cli', 'first_tester', null, 320, 900),
  activeUser('u-11', 'yuki', 'kitsune_mod', 60, 6),
  activeUser('u-12', 'ramen_lover', 'kitsune_mod', 58, 20),
  activeUser('u-13', 'shinobi', 'night_owl', 55, 200),
  activeUser('u-14', 'otaku.dmitry', 'tanuki_admin', 50, 2),
  activeUser('u-15', 'sakura_chan', 'kitsune_mod', 44, null),
  activeUser('u-16', 'big_reader', 'night_owl', 38, 12),
  activeUser('u-17', 'lena_v', 'kitsune_mod', 30, 90),
  activeUser('u-18', 'onepiece_fan', 'kitsune_mod', 26, 4),
  activeUser('u-19', 'quiet_one', 'night_owl', 20, 600),
  activeUser('u-20', 'tom.k', 'tanuki_admin', 14, 8),
  activeUser('u-21', 'manhwa_queen', 'kitsune_mod', 9, 1),
  { ...activeUser('u-22', 'newbie_01', 'kitsune_mod', 1, null), status: USER_STATUS.UNVERIFIED },
  activeUser('u-23', 'webtoon_guy', 'night_owl', 5, 40),
];

/** Базовая комбинация: на ней показаны все оси, кроме той, которую сравниваем. */
export const BASE_CONFIG: PanelConfig = {
  table: TABLE_LAYOUT.MERGED,
  actions: ACTIONS_MODE.MENU,
  filters: FILTERS_LAYOUT.SELECTS,
  block: BLOCK_FORM.SEGMENTED,
  confirm: DELETE_CONFIRM.TYPE_USERNAME,
  mobile: MOBILE_LAYOUT.CARDS,
};

/** Выбранная комбинация — «Итог». */
export const FINAL_CONFIG: PanelConfig = {
  table: TABLE_LAYOUT.ROLE_IN_USER,
  actions: ACTIONS_MODE.DRAWER,
  filters: FILTERS_LAYOUT.SELECTS,
  block: BLOCK_FORM.SELECT,
  confirm: DELETE_CONFIRM.CARD_AND_USERNAME,
  mobile: MOBILE_LAYOUT.SCROLL,
};

/** Кого блокировать и удалять в демо модалок. */
export const MODAL_DEMO_USER_ID = 'u-pavel';
