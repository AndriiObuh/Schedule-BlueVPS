import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { Worker, Task, DayInfo } from '../types';
import { MONTH_NAMES_UA, isDayOffTask } from './dateUtils';

/**
 * Export Schedule as Excel Matrix (.xlsx)
 * Clean schedule layout matching 1-in-1:
 * [Працівник] [Посада] [1 (СБ)] [2 (НД)] ... [31 (НД)] [Всього змін] [Всього годин]
 */
export function exportToExcelMatrix(
  year: number,
  monthIndex: number,
  workers: Worker[],
  tasks: Task[],
  monthDays: DayInfo[]
) {
  const monthName = MONTH_NAMES_UA[monthIndex];
  const dateStrs = new Set(monthDays.map((d) => d.dateStr));

  // Document Title Header
  const titleRow = [`ГРАФІК РОБОТИ — ${monthName.toUpperCase()} ${year}`];

  // Column Headers
  const headers = [
    'Працівник',
    'Посада',
    ...monthDays.map((d) => `${d.dayNumber} (${d.dayOfWeek.toUpperCase()})`),
    'Всього змін',
    'Всього годин',
  ];

  const dataRows: (string | number)[][] = [];

  // Rows for each worker
  workers.forEach((worker) => {
    const workerTasks = tasks.filter((t) => t.workerId === worker.id && dateStrs.has(t.date));
    const workingTasks = workerTasks.filter((t) => !isDayOffTask(t));
    const taskCount = workingTasks.length;
    const totalHours = workingTasks.reduce((sum, t) => sum + (t.hours || 0), 0);

    const dayCells = monthDays.map((d) => {
      const dayTasks = workerTasks.filter((t) => t.date === d.dateStr);
      if (dayTasks.length === 0) return '';
      return dayTasks.map((t) => t.title).join(', ');
    });

    dataRows.push([
      worker.name,
      worker.role || '—',
      ...dayCells,
      taskCount,
      totalHours,
    ]);
  });

  // Day column totals (working hours per day across all workers)
  const dayTotals = monthDays.map((d) => {
    const dayWorkingTasks = tasks.filter(
      (t) => dateStrs.has(t.date) && t.date === d.dateStr && !isDayOffTask(t)
    );
    return dayWorkingTasks.reduce((sum, t) => sum + (t.hours || 0), 0);
  });

  const grandHours = dataRows.reduce((sum, row) => sum + (Number(row[row.length - 1]) || 0), 0);
  const grandTasks = dataRows.reduce((sum, row) => sum + (Number(row[row.length - 2]) || 0), 0);

  // Bottom Summary Row
  const summaryRow = [
    'РАЗОМ ГОДИН ПО ДНЯХ',
    '—',
    ...dayTotals,
    grandTasks,
    grandHours,
  ];

  // Combine into full worksheet dataset
  const allRows = [titleRow, [], headers, ...dataRows, [], summaryRow];

  const worksheet = XLSX.utils.aoa_to_sheet(allRows);

  // Set explicit column widths for beautiful spacing without text overflow
  const colWidths = [
    { wch: 22 }, // Worker
    { wch: 20 }, // Role
    ...monthDays.map(() => ({ wch: 18 })), // Day columns
    { wch: 15 }, // Total tasks
    { wch: 15 }, // Total hours
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${monthName} ${year}`);

  XLSX.writeFile(workbook, `grafik_robuty_${monthName}_${year}.xlsx`);
}

/**
 * Export Schedule Grid as high-resolution PNG image (.png)
 * Clones the schedule element to render 100% of the entire schedule grid (all days 1-31 and all rows) without scrolling truncation.
 */
export async function exportToPngImage(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Не знайдено область графіку для створення зображення.');
    return;
  }

  try {
    const fullWidth = element.scrollWidth;
    const fullHeight = element.scrollHeight;

    // Create an offscreen clone expanded to full dimensions
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '-99999px';
    clone.style.top = '-99999px';
    clone.style.width = `${fullWidth}px`;
    clone.style.height = `${fullHeight}px`;
    clone.style.maxWidth = 'none';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.zIndex = '-99999';

    // Ensure children inside clone do not constrain width or scroll
    const children = clone.querySelectorAll('*');
    children.forEach((child) => {
      const el = child as HTMLElement;
      if (el.style) {
        el.style.overflow = 'visible';
      }
    });

    document.body.appendChild(clone);

    // Give browser brief tick to lay out clone
    await new Promise((resolve) => setTimeout(resolve, 150));

    const dataUrl = await toPng(clone, {
      cacheBust: true,
      backgroundColor: '#f8fafc',
      pixelRatio: 2, // Crisp high-DPI resolution
      width: fullWidth,
      height: fullHeight,
      filter: (node: HTMLElement) => {
        if (node.classList && node.classList.contains('no-export')) {
          return false;
        }
        return true;
      },
    });

    document.body.removeChild(clone);

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to capture schedule grid image:', error);
    alert('Не вдалося створити PNG зображення. Спробуйте ще раз.');
  }
}

/**
 * Export Schedule as CSV (.csv)
 */
export function exportToCsvList(
  year: number,
  monthIndex: number,
  workers: Worker[],
  tasks: Task[],
  monthDays: DayInfo[]
) {
  const workerMap = new Map(workers.map((w) => [w.id, w.name]));
  const dateStrs = new Set(monthDays.map((d) => d.dateStr));
  const monthTasks = tasks.filter((t) => dateStrs.has(t.date));

  const headers = ['Дата', 'Працівник', 'Завдання/Зміна', 'Час початку', 'Годин', 'Категорія', 'Пріоритет', 'Статус', 'Опис'];

  const categoryNames: Record<string, string> = {
    shift: 'Зміна',
    task: 'Завдання',
    vacation: 'Відпустка/Вихідний',
    overtime: 'Понаднормово',
  };

  const priorityNames: Record<string, string> = {
    low: 'Низький',
    medium: 'Середній',
    high: 'Високий',
    urgent: 'Терміновий',
  };

  const statusNames: Record<string, string> = {
    todo: 'Заплановано',
    in_progress: 'В процесі',
    completed: 'Завершено',
  };

  const rows = monthTasks.map((t) => {
    return [
      t.date,
      `"${workerMap.get(t.workerId) || '—'}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      t.startTime || '—',
      t.hours || 0,
      categoryNames[t.category] || t.category,
      priorityNames[t.priority] || t.priority,
      statusNames[t.status] || t.status,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  const monthName = MONTH_NAMES_UA[monthIndex];
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `grafik_robuty_${monthName}_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Schedule Data as JSON (.json)
 */
export function exportToJsonBackup(
  year: number,
  monthIndex: number,
  workers: Worker[],
  tasks: Task[]
) {
  const monthName = MONTH_NAMES_UA[monthIndex];
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    workers,
    tasks,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `grafik_robuty_backup_${monthName}_${year}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
