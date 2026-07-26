export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type TaskCategory = 'shift' | 'project' | 'maintenance' | 'vacation' | 'duty' | 'other';

export interface Task {
  id: string;
  workerId: string;
  date: string; // ISO date string YYYY-MM-DD
  title: string;
  description?: string;
  startTime?: string; // e.g. "08:00"
  endTime?: string; // e.g. "16:00"
  hours?: number;
  priority: Priority;
  status: TaskStatus;
  category: TaskCategory;
  color?: string;
  createdAt: string;
}

export interface Worker {
  id: string;
  code?: string;
  name: string;
  role: string;
  avatarBg?: string;
  color: string;
}

export interface ShiftPreset {
  id: string;
  title: string;       // e.g. "Зміна 1 (08:00-16:00)"
  startTime: string;   // "08:00"
  endTime: string;     // "16:00"
  hours: number;       // 8
  color: string;       // "#2563eb"
  category: TaskCategory;
  priority: Priority;
}

export interface DayInfo {
  dayNumber: number; // 1..31
  dateStr: string; // "YYYY-MM-DD"
  dayOfWeek: string; // "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"
  fullDayOfWeek: string; // "Понеділок", etc.
  isWeekend: boolean;
  isToday: boolean;
}

export type QuickPreset = ShiftPreset;

