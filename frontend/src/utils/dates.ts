import dayjs, { type Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export function isWeekend(date: Dayjs): boolean {
  const day = date.day();
  return day === 0 || day === 6;
}

export function nextBusinessDay(date: Dayjs): Dayjs {
  let current = date;
  while (isWeekend(current)) {
    current = current.add(1, 'day');
  }
  return current;
}

export function formatDate(date: string | Dayjs, pattern = 'DD/MM/YYYY'): string {
  return dayjs(date).format(pattern);
}

export function formatMonthYear(month: number, year: number): string {
  return dayjs()
    .year(year)
    .month(month - 1)
    .format('MMMM [de] YYYY');
}

export function toIsoDate(date: Dayjs): string {
  return date.format('YYYY-MM-DD');
}

export function daysUntil(date: string): number {
  return dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
}

export function isWithinNextDays(date: string, days: number): boolean {
  const target = dayjs(date).startOf('day');
  const today = dayjs().startOf('day');
  const limit = today.add(days, 'day');
  return target.isSameOrAfter(today) && target.isSameOrBefore(limit);
}

export function isPastDue(date: string): boolean {
  return dayjs(date).startOf('day').isBefore(dayjs().startOf('day'));
}

export { dayjs };
