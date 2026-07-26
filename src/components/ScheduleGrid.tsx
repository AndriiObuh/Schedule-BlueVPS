import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, CheckCircle, Clock, UserCheck, Copy, ClipboardPaste, Trash2, X, MousePointerClick } from 'lucide-react';
import { Worker, Task, DayInfo } from '../types';
import { hexToRgba, isDayOffTask, getShiftPluralUA } from '../utils/dateUtils';

interface CellSelection {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

interface ClipboardItem {
  relRow: number;
  relCol: number;
  taskData: Omit<Task, 'id' | 'createdAt' | 'workerId' | 'date'>;
}

interface ScheduleGridProps {
  workers: Worker[];
  days: DayInfo[];
  tasks: Task[];
  onCellClick: (worker: Worker, day: DayInfo) => void;
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
  onQuickToggleStatus: (task: Task, e: React.MouseEvent) => void;
  selectedWorkerIdFilter: string;
  onBatchAddTasks?: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => void;
  onBatchDeleteTasks?: (taskIds: string[]) => void;
  onUndo?: () => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  workers,
  days,
  tasks,
  onCellClick,
  onTaskClick,
  onQuickToggleStatus,
  selectedWorkerIdFilter,
  onBatchAddTasks,
  onBatchDeleteTasks,
  onUndo,
}) => {
  // Filter workers if a specific worker is selected in filter bar
  const displayedWorkers = selectedWorkerIdFilter === 'all'
    ? workers
    : workers.filter((w) => w.id === selectedWorkerIdFilter);

  // Selection & Clipboard State
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [anchorCell, setAnchorCell] = useState<{ row: number; col: number } | null>(null);
  const dragStartSelectionRef = useRef<Set<string>>(new Set());

  // Load initial clipboard from localStorage
  const [clipboard, setClipboard] = useState<ClipboardItem[]>(() => {
    try {
      const saved = localStorage.getItem('august_schedule_clipboard');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse clipboard from localStorage', e);
    }
    return [];
  });

  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync clipboard state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('august_schedule_clipboard', JSON.stringify(clipboard));
    } catch (e) {
      console.error('Failed to save clipboard to localStorage', e);
    }
  }, [clipboard]);

  const showToast = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Quick lookup helper: get tasks for a worker on a specific date string
  const getTasksForCell = (workerId: string, dateStr: string) => {
    return tasks.filter((t) => t.workerId === workerId && t.date === dateStr);
  };

  // Active dates in current month grid
  const currentMonthDates = useMemo(() => new Set(days.map((d) => d.dateStr)), [days]);

  // Helper to calculate total hours assigned to a worker for current displayed month/days
  const getWorkerTotalHours = (workerId: string) => {
    return tasks
      .filter((t) => t.workerId === workerId && currentMonthDates.has(t.date) && !isDayOffTask(t))
      .reduce((sum, t) => sum + (t.hours || 0), 0);
  };

  // Helper to calculate total tasks count for a worker in current displayed month/days
  const getWorkerTaskCount = (workerId: string) => {
    return tasks.filter((t) => t.workerId === workerId && currentMonthDates.has(t.date) && !isDayOffTask(t)).length;
  };

  // COPY FUNCTION
  const handleCopy = useCallback(() => {
    if (selectedCellKeys.size === 0) {
      showToast('Спочатку виділіть клітинки (натисніть з Ctrl або протягніть)', 'warn');
      return;
    }

    const parsedCells = Array.from(selectedCellKeys).map((k) => {
      const [r, c] = k.split('_').map(Number);
      return { r, c };
    });

    const minRow = Math.min(...parsedCells.map((p) => p.r));
    const minCol = Math.min(...parsedCells.map((p) => p.c));

    const items: ClipboardItem[] = [];
    parsedCells.forEach(({ r, c }) => {
      const worker = displayedWorkers[r];
      const day = days[c];
      if (worker && day) {
        const cellTasks = getTasksForCell(worker.id, day.dateStr);
        cellTasks.forEach((t) => {
          items.push({
            relRow: r - minRow,
            relCol: c - minCol,
            taskData: {
              title: t.title,
              startTime: t.startTime || '',
              endTime: t.endTime || '',
              hours: t.hours !== undefined ? t.hours : 0,
              category: t.category || 'shift',
              priority: t.priority || 'medium',
              status: t.status || 'todo',
              description: t.description || '',
              color: t.color || '#2563eb',
            },
          });
        });
      }
    });

    if (items.length === 0) {
      showToast('У виділених клітинках немає завдань для копіювання', 'warn');
      return;
    }

    setClipboard(items);
    showToast(`Скопійовано ${items.length} зміну(и) з ${selectedCellKeys.size} виділеної(их) клітинки(ок)!`, 'success');
  }, [selectedCellKeys, displayedWorkers, days, tasks]);

  // PASTE FUNCTION
  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) {
      showToast('Буфер обміну порожній. Спочатку виділіть клітинку із завданням та натисніть Ctrl+C', 'warn');
      return;
    }

    const targetCells = Array.from(selectedCellKeys).map((k) => {
      const [r, c] = k.split('_').map(Number);
      return { r, c };
    });

    if (targetCells.length === 0) {
      targetCells.push({ r: 0, c: 0 });
    }

    const targetMinRow = Math.min(...targetCells.map((p) => p.r));
    const targetMinCol = Math.min(...targetCells.map((p) => p.c));

    const newTasksList: Omit<Task, 'id' | 'createdAt'>[] = [];

    // Check if copied pattern is from a single cell
    const isSingleCellCopied = clipboard.every((item) => item.relRow === 0 && item.relCol === 0);

    if (isSingleCellCopied && targetCells.length > 1) {
      // Tile/repeat copied task across all selected target cells
      targetCells.forEach(({ r, c }) => {
        if (r < displayedWorkers.length && c < days.length) {
          const worker = displayedWorkers[r];
          const day = days[c];
          if (worker && day) {
            clipboard.forEach((item) => {
              newTasksList.push({
                ...item.taskData,
                workerId: worker.id,
                date: day.dateStr,
              });
            });
          }
        }
      });
    } else {
      // Standard 1:1 paste relative to top-left of selection
      clipboard.forEach((item) => {
        const destRow = targetMinRow + item.relRow;
        const destCol = targetMinCol + item.relCol;

        if (destRow < displayedWorkers.length && destCol < days.length) {
          const worker = displayedWorkers[destRow];
          const day = days[destCol];
          if (worker && day) {
            newTasksList.push({
              ...item.taskData,
              workerId: worker.id,
              date: day.dateStr,
            });
          }
        }
      });
    }

    if (newTasksList.length > 0) {
      if (onBatchAddTasks) {
        onBatchAddTasks(newTasksList);
      }
      showToast(`Успішно вставлено ${newTasksList.length} зміну(и)!`, 'success');
    } else {
      showToast('Неможливо вставити: виділена позиція виходить за межі таблиці', 'warn');
    }
  }, [clipboard, selectedCellKeys, displayedWorkers, days, onBatchAddTasks]);

  // DELETE SELECTION FUNCTION
  const handleDeleteSelection = useCallback(() => {
    if (selectedCellKeys.size === 0) return;

    const taskIdsToDelete: string[] = [];
    selectedCellKeys.forEach((k) => {
      const [r, c] = k.split('_').map(Number);
      const worker = displayedWorkers[r];
      const day = days[c];
      if (worker && day) {
        const cellTasks = getTasksForCell(worker.id, day.dateStr);
        cellTasks.forEach((t) => taskIdsToDelete.push(t.id));
      }
    });

    if (taskIdsToDelete.length === 0) {
      showToast('У виділених клітинках немає змін для видалення', 'info');
      return;
    }

    if (onBatchDeleteTasks) {
      onBatchDeleteTasks(taskIdsToDelete);
      showToast(`Видалено ${taskIdsToDelete.length} зміну(и)`, 'info');
    }
  }, [selectedCellKeys, displayedWorkers, days, tasks, onBatchDeleteTasks]);

  // KEYBOARD SHORTCUTS LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyZ' || e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'я')) {
        e.preventDefault();
        onUndo?.();
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'с')) {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyV' || e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'м')) {
        e.preventDefault();
        handlePaste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCellKeys.size > 0) {
          e.preventDefault();
          handleDeleteSelection();
        }
      } else if (e.key === 'Escape') {
        setSelectedCellKeys(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, handleDeleteSelection, selectedCellKeys, onUndo]);

  // MOUSE DRAG & CTRL CLICK EVENT HANDLERS
  const handleCellMouseDown = (rIndex: number, cIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click

    const cellKey = `${rIndex}_${cIndex}`;
    const isCtrl = e.ctrlKey || e.metaKey;

    setIsDragging(true);
    setAnchorCell({ row: rIndex, col: cIndex });

    if (isCtrl) {
      dragStartSelectionRef.current = new Set(selectedCellKeys);
      const updated = new Set(selectedCellKeys);
      if (updated.has(cellKey)) {
        updated.delete(cellKey);
      } else {
        updated.add(cellKey);
      }
      setSelectedCellKeys(updated);
    } else {
      dragStartSelectionRef.current = new Set();
      setSelectedCellKeys(new Set([cellKey]));
    }
  };

  const handleCellMouseEnter = (rIndex: number, cIndex: number) => {
    if (!isDragging || !anchorCell) return;

    const minR = Math.min(anchorCell.row, rIndex);
    const maxR = Math.max(anchorCell.row, rIndex);
    const minC = Math.min(anchorCell.col, cIndex);
    const maxC = Math.max(anchorCell.col, cIndex);

    const currentRectKeys = new Set<string>();
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        currentRectKeys.add(`${r}_${c}`);
      }
    }

    if (dragStartSelectionRef.current.size > 0) {
      const merged = new Set(dragStartSelectionRef.current);
      currentRectKeys.forEach((k) => merged.add(k));
      setSelectedCellKeys(merged);
    } else {
      setSelectedCellKeys(currentRectKeys);
    }
  };

  const handleGlobalMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleGlobalMouseUp]);

  // Selected Count Helpers
  const selectedCellsCount = selectedCellKeys.size;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none bg-slate-100">
      
      {/* Scrollable Schedule Grid */}
      <div id="schedule-grid-export-area" className="w-full h-full overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-100">
        <div className="inline-block min-w-full align-middle">
          <table className="border-collapse w-full text-left table-fixed">
            {/* Table Header: Days of Month */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                
                {/* Sticky Left Header for Workers */}
                <th className="sticky left-0 z-20 w-[220px] min-w-[220px] bg-white px-4 py-3 border-r border-b border-slate-200 font-bold text-xs tracking-wider uppercase text-slate-700 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Працівники
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">{days.length} Днів</span>
                  </div>
                </th>

                {/* Day Columns */}
                {days.map((day, cIndex) => {
                  const isWeekend = day.isWeekend;
                  const isToday = day.isToday;

                  return (
                    <th
                      key={day.dateStr}
                      className={`w-[110px] min-w-[110px] px-2 py-2 text-center border-r border-slate-200/80 transition-colors ${
                        isToday
                          ? 'bg-blue-50/90 border-blue-300 text-blue-900'
                          : isWeekend
                          ? 'bg-slate-100/80 text-rose-600'
                          : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${
                          isWeekend ? 'text-rose-500' : 'text-slate-500'
                        }`}>
                          {day.dayOfWeek}
                        </span>
                        <div className="flex items-center justify-center mt-0.5">
                          <span className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center transition ${
                            isToday
                              ? 'bg-blue-600 text-white shadow-xs'
                              : isWeekend
                              ? 'bg-rose-100 text-rose-700 font-extrabold'
                              : 'text-slate-800'
                          }`}>
                            {day.dayNumber}
                          </span>
                        </div>
                        {isToday && (
                          <span className="text-[9px] font-bold text-blue-600 tracking-tight mt-0.5 uppercase">
                            Сьогодні
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {displayedWorkers.map((worker, rIndex) => {
                const totalHours = getWorkerTotalHours(worker.id);
                const totalTasks = getWorkerTaskCount(worker.id);

                return (
                  <tr
                    key={worker.id}
                    className="group/row transition-colors"
                  >
                    {/* Sticky Worker Column */}
                    <td className="sticky left-0 z-10 w-[220px] min-w-[220px] bg-white px-3.5 py-3 border-r border-slate-200 shadow-2xs group-hover/row:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar Badge */}
                        <div
                          style={{ backgroundColor: worker.color }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-2xs shrink-0 ring-1 ring-slate-200 uppercase"
                        >
                          {worker.name.trim().charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-900 truncate">
                              {worker.name}
                            </h3>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                            {worker.role}
                          </p>
                          
                          {/* Summary Badges */}
                          <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                              {totalTasks} {getShiftPluralUA(totalTasks)}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                              {totalHours} год
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Days Cells */}
                    {days.map((day, cIndex) => {
                      const cellTasks = getTasksForCell(worker.id, day.dateStr);
                      const isWeekend = day.isWeekend;
                      const isToday = day.isToday;

                      // Check if this cell is currently selected in selection range
                      const isSelected = selectedCellKeys.has(`${rIndex}_${cIndex}`);

                      return (
                        <td
                          key={`${worker.id}-${day.dateStr}`}
                          onMouseDown={(e) => handleCellMouseDown(rIndex, cIndex, e)}
                          onMouseEnter={() => handleCellMouseEnter(rIndex, cIndex)}
                          onDoubleClick={() => onCellClick(worker, day)}
                          className={`w-[110px] min-w-[110px] h-[85px] p-1.5 align-top border-r border-b border-slate-200/80 relative group/cell cursor-pointer transition-colors duration-100 ${
                            isSelected
                              ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-500/80 ring-inset z-10'
                              : isToday
                              ? 'bg-blue-50/30 hover:bg-blue-50/80'
                              : isWeekend
                              ? 'bg-slate-50/50 hover:bg-slate-100/80'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {/* Tasks Container */}
                          <div className="flex flex-col gap-1 h-full overflow-hidden">
                            {cellTasks.length === 0 ? (
                              /* Empty Cell Placeholder */
                              <div
                                className="w-full h-full rounded-md flex items-center justify-center text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity border border-dashed border-slate-300 pointer-events-none"
                                title="Подвійне клацання для створення завдання"
                              >
                                <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                                  <Plus className="w-3 h-3" /> 2x клік
                                </span>
                              </div>
                            ) : (
                              /* Task Badges inside cell */
                              cellTasks.map((task) => {
                                const isDone = task.status === 'completed';
                                const isInProgress = task.status === 'in_progress';
                                const taskColor = task.color || '#2563eb';

                                // Tint background with soft shade of selected shift/task color
                                const bgStyle = hexToRgba(taskColor, isDone ? 0.08 : 0.16);
                                const borderStyle = hexToRgba(taskColor, isDone ? 0.25 : 0.45);

                                return (
                                  <div
                                    key={task.id}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      onTaskClick(task, e);
                                    }}
                                    style={{
                                      backgroundColor: bgStyle,
                                      borderColor: borderStyle,
                                      borderLeftColor: taskColor,
                                    }}
                                    className={`group/task relative p-1.5 rounded-lg text-[11px] leading-tight border-l-4 border-t border-r border-b shadow-2xs transition-all hover:scale-[1.02] hover:z-20 cursor-pointer ${
                                      isDone ? 'opacity-70' : ''
                                    }`}
                                    title="Подвійне клацання для редагування"
                                  >
                                    {/* Task Title */}
                                    <div className="flex items-start justify-between gap-1">
                                      <span
                                        className={`font-bold truncate text-[11px] ${
                                          isDone
                                            ? 'line-through text-slate-500'
                                            : 'text-slate-900'
                                        }`}
                                      >
                                        {task.title}
                                      </span>

                                      {/* Quick Status Toggle Checkbox */}
                                      <button
                                        onClick={(e) => onQuickToggleStatus(task, e)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={`shrink-0 rounded p-0.5 transition ${
                                          isDone
                                            ? 'text-emerald-700 hover:text-emerald-800'
                                            : isInProgress
                                            ? 'text-amber-700 hover:text-amber-800'
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                        title={
                                          isDone
                                            ? 'Статус: Виконано'
                                            : isInProgress
                                            ? 'Статус: В процесі'
                                            : 'Статус: Заплановано'
                                        }
                                      >
                                        <CheckCircle
                                          className={`w-3.5 h-3.5 ${
                                            isDone ? 'fill-emerald-200' : ''
                                          }`}
                                        />
                                      </button>
                                    </div>

                                    {/* Task Subtitle: Time & Priority */}
                                    <div className="flex items-center justify-between text-[9px] font-semibold text-slate-700 mt-1">
                                      {isDayOffTask(task) ? (
                                        <span className="font-bold text-slate-600 text-[9px]">
                                          {task.title.toLowerCase().includes('відпустка') ? 'Відпустка' : 'Вихідний'}
                                        </span>
                                      ) : task.startTime ? (
                                        <span className="flex items-center gap-0.5 font-bold text-slate-800">
                                          <Clock className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                                          {task.startTime}
                                          {task.hours ? ` (${task.hours}г)` : ''}
                                        </span>
                                      ) : (
                                        <span className="font-bold text-slate-800">{task.hours ? `${task.hours} год` : ''}</span>
                                      )}

                                      {/* Priority badge - only for working tasks */}
                                      {!isDayOffTask(task) && task.priority === 'urgent' && (
                                        <span className="bg-rose-200/90 text-rose-900 px-1 rounded text-[8px] font-black uppercase border border-rose-300">
                                          SOS
                                        </span>
                                      )}
                                      {!isDayOffTask(task) && task.priority === 'high' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 ring-1 ring-amber-300" title="Високий пріоритет" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'warn'
                ? 'bg-amber-900 text-amber-50 border-amber-700'
                : 'bg-slate-900 text-slate-50 border-slate-700'
            }`}
          >
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Static Footer Bar with Keyboard Shortcuts & Selection Info */}
      <div className="shrink-0 bg-slate-900 text-white px-4 py-2.5 border-t border-slate-700/80 text-xs flex flex-wrap items-center justify-between gap-3 z-10 shadow-lg">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded-md text-amber-300 font-mono font-bold text-[11px] shadow-xs">2x Клік</kbd>
            <span>Додати / ред.</span>
          </span>
          <span className="w-px h-3.5 bg-slate-700/80" />
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded-md text-amber-300 font-mono font-bold text-[11px] shadow-xs">Ctrl + Клік</kbd>
            <span>/ Drag: виділити</span>
          </span>
          <span className="w-px h-3.5 bg-slate-700/80" />
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded-md text-amber-300 font-mono font-bold text-[11px] shadow-xs">Ctrl+C</kbd>
            <span>/</span>
            <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded-md text-amber-300 font-mono font-bold text-[11px] shadow-xs">Ctrl+V</kbd>
            <span>Копіювати / Вставити</span>
          </span>
          <span className="w-px h-3.5 bg-slate-700/80" />
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded-md text-amber-300 font-mono font-bold text-[11px] shadow-xs">Ctrl+Z</kbd>
            <span>Відмінити</span>
          </span>
          <span className="w-px h-3.5 bg-slate-700/80" />
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded-md text-amber-300 font-mono font-bold text-[11px] shadow-xs">Del</kbd>
            <span>Очистити</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {selectedCellKeys.size > 0 && (
            <div className="flex items-center gap-2 bg-blue-900/90 text-white border border-blue-600 px-3 py-1 rounded-lg shadow-xs">
              <span className="font-semibold text-xs">Виділено: <strong className="text-blue-200 font-extrabold">{selectedCellKeys.size}</strong></span>
              <button
                onClick={handleCopy}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded cursor-pointer text-[11px] font-bold transition ml-1"
                title="Скопіювати (Ctrl+C)"
              >
                Копіювати
              </button>
              <button
                onClick={handleDeleteSelection}
                className="bg-rose-800 hover:bg-rose-700 text-white px-2 py-0.5 rounded cursor-pointer text-[11px] font-bold transition"
                title="Видалити (Delete)"
              >
                Видалити
              </button>
              <button
                onClick={() => setSelectedCellKeys(new Set())}
                className="text-slate-300 hover:text-white text-[11px] ml-1 cursor-pointer font-bold px-1"
                title="Скинути (Esc)"
              >
                ✕
              </button>
            </div>
          )}

          {clipboard.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-900/90 text-white border border-emerald-600 px-3 py-1 rounded-lg shadow-xs text-xs">
              <span className="font-semibold">В буфері: <strong className="text-emerald-200 font-extrabold">{clipboard.length}</strong></span>
              <button
                onClick={handlePaste}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded cursor-pointer font-bold text-[11px] transition"
                title="Вставити (Ctrl+V)"
              >
                Вставити (Ctrl+V)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

