import { DayInfo } from '../types';

export const MONTH_NAMES_UA = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export const MONTH_NAMES_GENITIVE_UA = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
];

export const WEEKDAYS_SHORT_UA = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const WEEKDAYS_FULL_UA = [
  'Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'
];

/**
 * Returns array of DayInfo for all days of any given month (0..11) and year
 */
export function getMonthDays(year: number, monthIndex: number): DayInfo[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const days: DayInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const monthPadded = String(monthIndex + 1).padStart(2, '0');
    const dayPadded = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthPadded}-${dayPadded}`;
    const dayOfWeekIndex = date.getDay(); // 0 is Sunday, 1 is Monday ...

    const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;
    const isToday = (year === todayYear && monthIndex === todayMonth && d === todayDay);

    days.push({
      dayNumber: d,
      dateStr,
      dayOfWeek: WEEKDAYS_SHORT_UA[dayOfWeekIndex],
      fullDayOfWeek: WEEKDAYS_FULL_UA[dayOfWeekIndex],
      isWeekend,
      isToday,
    });
  }

  return days;
}

/**
 * Legacy compatibility helper for August
 */
export function getAugustDays(year = 2026): DayInfo[] {
  return getMonthDays(year, 7);
}

export function formatDateUA(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${day} ${MONTH_NAMES_GENITIVE_UA[monthIndex] || ''} ${year}`;
}

/**
 * Automatically calculates duration in hours between start time (HH:MM) and end time (HH:MM),
 * taking into account overnight shifts (e.g. 19:00 - 03:00 = 8 hours).
 */
export function calculateShiftHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 8;
  const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
  const [endH, endM] = endTime.split(':').map((v) => parseInt(v, 10) || 0);

  let startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;

  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60; // Overnight shift
  }

  const diffMinutes = endTotalMinutes - startTotalMinutes;
  const hours = diffMinutes / 60;
  return Math.round(hours * 10) / 10;
}

/**
 * Converts a hex color string (e.g. #2563eb) to an RGBA string with given alpha opacity.
 */
export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(37, 99, 235, ${alpha})`;
  let c = hex.trim().replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(37, 99, 235, ${alpha})`;
}

/**
 * Returns Ukrainian pluralized form for shifts ("зміна", "зміни", "змін")
 */
export function getShiftPluralUA(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'змін';
  if (mod10 === 1) return 'зміна';
  if (mod10 >= 2 && mod10 <= 4) return 'зміни';
  return 'змін';
}

/**
 * Returns true if a task represents a day off ("Вихідний" / "Відпустка" / vacation).
 * Day off tasks do not count towards working tasks count or working hours.
 */
export function isDayOffTask(task: { title?: string; category?: string }): boolean {
  if (!task) return false;
  if (task.category === 'vacation' || task.category === 'dayoff' || task.category === 'day_off') {
    return true;
  }
  const titleLower = (task.title || '').trim().toLowerCase();
  if (
    titleLower.includes('вихідний') ||
    titleLower.includes('відпустка') ||
    titleLower.includes('day off') ||
    titleLower.includes('dayoff')
  ) {
    return true;
  }
  return false;
}

