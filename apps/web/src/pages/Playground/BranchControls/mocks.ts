import type { Branch } from '@tanuki/contracts';
import { daysAgo } from './lib';

/** Ветки уже отсортированы по полноте, как их отдаёт бек: первая — ветка по умолчанию. */
export const DEMO_BRANCHES: Branch[] = [
  {
    id: 'dead-inside',
    name: 'Dead Inside Team',
    scanlator: 'Dead Inside Team',
    chaptersCount: 197,
    lastUpdatedAt: daysAgo(2),
  },
  {
    id: 'night-club',
    name: 'Клуб любителей ночного перевода манхвы',
    scanlator: 'Клуб любителей ночного перевода манхвы',
    chaptersCount: 143,
    lastUpdatedAt: daysAgo(1),
  },
  {
    id: 'assley',
    name: 'Assley Team',
    scanlator: 'Assley Team',
    chaptersCount: 62,
    lastUpdatedAt: daysAgo(40),
  },
  {
    id: 'insidium',
    name: 'Insidium Plus',
    scanlator: 'Insidium Plus',
    chaptersCount: 54,
    lastUpdatedAt: daysAgo(120),
  },
  {
    id: 'twilight',
    name: 'Twilight Scans & Friends Translation Group',
    scanlator: 'Twilight Scans & Friends Translation Group',
    chaptersCount: 18,
    lastUpdatedAt: daysAgo(5),
  },
  {
    id: 'ronin',
    name: 'Ронин',
    scanlator: 'Ронин',
    chaptersCount: 3,
    lastUpdatedAt: daysAgo(300),
  },
];
