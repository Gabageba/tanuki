import { MinusIcon, TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react';
import type { ProfileStatisticsResponse } from '@tanuki/contracts';

/** Разница «сегодня» со средним днём, в главах; null — сравнивать не с чем. */
export const getTodayDelta = ({ today }: ProfileStatisticsResponse) =>
  today.averagePerDay > 0 ? Math.round(today.chapters - today.averagePerDay) : null;

/**
 * Насколько темп месяца (глав в день с его начала) выше или ниже обычного — среднего за 30 дней
 * до начала месяца, в процентах; null — сравнивать не с чем.
 */
export const getMonthDeltaPercent = ({ month }: ProfileStatisticsResponse) => {
  if (month.baselinePerDay === 0 || month.daysElapsed === 0) return null;
  const pace = month.chapters / month.daysElapsed;
  return Math.round((pace / month.baselinePerDay - 1) * 100);
};

/** «+3» / «−9» / «0» — со знаком, минус типографский. */
export const formatSigned = (value: number) => {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return '0';
};

/** Иконка и цвет подсказки по знаку разницы. */
export const getTrendHint = (delta: number, text: string) => {
  if (delta > 0) return { icon: <TrendUpIcon />, text, color: 'green' };
  if (delta < 0) return { icon: <TrendDownIcon />, text, color: 'red' };
  return { icon: <MinusIcon />, text };
};
