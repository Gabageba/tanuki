import {
  CalendarPlusIcon,
  EnvelopeSimpleIcon,
  HourglassIcon,
  ShieldIcon,
  SignInIcon,
  TagIcon,
  UserIcon,
  UserPlusIcon,
} from '@phosphor-icons/react';
import { SORT_DIRECTION } from '@tanuki/contracts';
import {
  INVITE_SORT_KEY,
  USER_SORT_KEY,
  type InviteSortKey,
  type SortColumn,
  type UserSortKey,
} from './models';

const ICON_SIZE = 16;

export const USER_COLUMNS: SortColumn<UserSortKey>[] = [
  {
    id: 'user',
    title: 'Пользователь',
    keys: [
      {
        key: USER_SORT_KEY.USERNAME,
        label: 'Имя',
        menuLabel: 'По имени',
        keyLabel: 'имя',
        shortLabel: 'по имени',
        icon: <UserIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
      {
        key: USER_SORT_KEY.EMAIL,
        label: 'Почта',
        menuLabel: 'По почте',
        keyLabel: 'почта',
        shortLabel: 'по почте',
        icon: <EnvelopeSimpleIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
    ],
  },
  {
    id: 'status',
    title: 'Статус',
    keys: [
      {
        key: USER_SORT_KEY.STATUS,
        label: 'Статус',
        menuLabel: 'По статусу',
        keyLabel: 'статус',
        shortLabel: 'по статусу',
        icon: <TagIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
      {
        key: USER_SORT_KEY.STATUS_UNTIL,
        label: 'Срок',
        menuLabel: 'По сроку',
        keyLabel: 'срок',
        shortLabel: 'по сроку',
        icon: <HourglassIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
    ],
  },
  {
    id: 'invitedBy',
    title: 'Пригласил',
    keys: [
      {
        key: USER_SORT_KEY.INVITED_BY,
        label: 'Пригласил',
        menuLabel: 'По пригласившему',
        keyLabel: 'пригласивший',
        shortLabel: 'по пригласившему',
        icon: <UserPlusIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
    ],
  },
  {
    id: 'dates',
    title: 'Даты',
    keys: [
      {
        key: USER_SORT_KEY.CREATED_AT,
        label: 'Регистрация',
        menuLabel: 'По регистрации',
        keyLabel: 'регистрация',
        shortLabel: 'по регистрации',
        icon: <CalendarPlusIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.DESC,
      },
      {
        key: USER_SORT_KEY.LAST_SEEN_AT,
        label: 'Вход',
        menuLabel: 'По входу',
        keyLabel: 'вход',
        shortLabel: 'по входу',
        icon: <SignInIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.DESC,
      },
    ],
  },
];

export const INVITE_COLUMNS: SortColumn<InviteSortKey>[] = [
  {
    id: 'role',
    title: 'Роль',
    keys: [
      {
        key: INVITE_SORT_KEY.ROLE,
        label: 'Роль',
        menuLabel: 'По роли',
        keyLabel: 'роль',
        shortLabel: 'по роли',
        icon: <ShieldIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
    ],
  },
  {
    id: 'createdBy',
    title: 'Создал',
    keys: [
      {
        key: INVITE_SORT_KEY.CREATED_BY,
        label: 'Создал',
        menuLabel: 'По автору',
        keyLabel: 'автор',
        shortLabel: 'по автору',
        icon: <UserIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
      {
        key: INVITE_SORT_KEY.CREATED_AT,
        label: 'Дата',
        menuLabel: 'По дате создания',
        keyLabel: 'дата',
        shortLabel: 'по дате',
        icon: <CalendarPlusIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.DESC,
      },
    ],
  },
  {
    id: 'status',
    title: 'Статус',
    keys: [
      {
        key: INVITE_SORT_KEY.STATUS,
        label: 'Статус',
        menuLabel: 'По статусу',
        keyLabel: 'статус',
        shortLabel: 'по статусу',
        icon: <TagIcon size={ICON_SIZE} />,
        defaultDirection: SORT_DIRECTION.ASC,
      },
    ],
  },
  { id: 'result', title: 'Результат', keys: [] },
];
