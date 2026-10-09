import { MOCK_TYPE, type MockNotification } from './models';

/** Лента администратора: по одному уведомлению каждого типа, новые сверху. */
export const MOCK_FEED: MockNotification[] = [
  {
    id: 'n1',
    type: MOCK_TYPE.NEW_DEVICE_LOGIN,
    subject: null,
    count: null,
    detail: 'Chrome · macOS',
    coverSeed: null,
    ago: '5 мин назад',
  },
  {
    id: 'n2',
    type: MOCK_TYPE.NEW_CHAPTERS,
    subject: 'Берсерк',
    count: 3,
    detail: null,
    coverSeed: 'tanuki-berserk',
    ago: '2 ч назад',
  },
  {
    id: 'n3',
    type: MOCK_TYPE.SOURCE_DOWN,
    subject: 'Remanga',
    count: null,
    detail: null,
    coverSeed: null,
    ago: '3 ч назад',
  },
  {
    id: 'n4',
    type: MOCK_TYPE.NEW_CHAPTERS,
    subject: 'Поднятие уровня в одиночку',
    count: 1,
    detail: null,
    coverSeed: 'tanuki-solo',
    ago: '5 ч назад',
  },
  {
    id: 'n5',
    type: MOCK_TYPE.PARSER_DOWN,
    subject: 'Remanga',
    count: null,
    detail: 'сайт не отвечает',
    coverSeed: null,
    ago: '6 ч назад',
  },
  {
    id: 'n6',
    type: MOCK_TYPE.NEW_CHAPTERS,
    subject:
      'Становление злодейки: как я случайно получила в мужья северного герцога, которого все боялись',
    count: 12,
    detail: null,
    coverSeed: 'tanuki-villainess',
    ago: 'вчера',
  },
  {
    id: 'n7',
    type: MOCK_TYPE.SOURCE_RECOVERED,
    subject: 'Mangalib',
    count: null,
    detail: null,
    coverSeed: null,
    ago: 'вчера',
  },
  {
    id: 'n8',
    type: MOCK_TYPE.INVITE_USED,
    subject: 'yuki',
    count: null,
    detail: null,
    coverSeed: null,
    ago: '2 дня назад',
  },
  {
    id: 'n9',
    type: MOCK_TYPE.EMAIL_CHANGED,
    subject: null,
    count: null,
    detail: null,
    coverSeed: null,
    ago: '3 дня назад',
  },
  {
    id: 'n10',
    type: MOCK_TYPE.PARSER_RECOVERED,
    subject: 'Mangalib',
    count: null,
    detail: null,
    coverSeed: null,
    ago: '4 дня назад',
  },
  {
    id: 'n11',
    type: MOCK_TYPE.INVITE_EXPIRED,
    subject: null,
    count: null,
    detail: 'создан 2 октября 2026 г.',
    coverSeed: null,
    ago: '5 дней назад',
  },
  {
    id: 'n12',
    type: MOCK_TYPE.DELETION_REQUESTED,
    subject: null,
    count: null,
    detail: null,
    coverSeed: null,
    ago: '6 дней назад',
  },
];

const TOTAL_LONG_FEED = 47;

/** 47 записей для страниц: те же двенадцать по кругу. */
export const MOCK_LONG_FEED: MockNotification[] = Array.from(
  { length: TOTAL_LONG_FEED },
  (_, index) => {
    const base = MOCK_FEED[index % MOCK_FEED.length];
    return { ...base, id: `long-${index}` } as MockNotification;
  },
);

const TOAST_IDS = ['n1', 'n3', 'n5', 'n7'];

/** Примеры для тостов: вход с нового устройства, источник лёг, парсер упал, источник ожил. */
export const MOCK_TOAST_ITEMS = MOCK_FEED.filter((item) => TOAST_IDS.includes(item.id));
