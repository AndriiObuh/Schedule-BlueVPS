import React from 'react';
import { Task, Worker } from '../types';
import { formatDateUA } from '../utils/dateUtils';
import { Clock, CheckCircle2, Trash2, Edit2, User } from 'lucide-react';

interface TaskListTableProps {
  tasks: Task[];
  workers: Worker[];
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
  onQuickToggleStatus: (task: Task, e: React.MouseEvent) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskListTable: React.FC<TaskListTableProps> = ({
  tasks,
  workers,
  onTaskClick,
  onQuickToggleStatus,
  onDeleteTask,
}) => {
  const getWorker = (workerId: string) => {
    return workers.find((w) => w.id === workerId) || {
      code: '?',
      name: 'Невідомий',
      color: '#6b7280',
      role: '',
    };
  };

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <p className="text-base font-bold text-slate-800">Не знайдено жодного завдання за вказаними фільтрами</p>
        <p className="text-xs text-slate-500 font-medium">Спробуйте змінити фільтри або натисніть на будь-яку клітинку в календарі, щоб призначити нове завдання.</p>
      </div>
    );
  }

  // Sort tasks by date
  const sortedTasks = [...tasks].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Працівник</th>
                <th className="px-4 py-3">Завдання</th>
                <th className="px-4 py-3">Час / Години</th>
                <th className="px-4 py-3">Категорія</th>
                <th className="px-4 py-3">Пріоритет</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedTasks.map((t) => {
                const worker = getWorker(t.workerId);
                const isDone = t.status === 'completed';

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {formatDateUA(t.date)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: worker.color }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white font-extrabold text-[10px] shadow-2xs uppercase"
                        >
                          {worker.name.trim().charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{worker.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t.color || '#2563eb' }}
                        />
                        <span className={isDone ? 'line-through text-slate-400' : ''}>
                          {t.title}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-sm">
                          {t.description}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.startTime ? (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3 h-3 text-blue-600" />
                          {t.startTime} - {t.endTime} ({t.hours}г)
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700">{t.hours} год</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap capitalize text-slate-600 font-medium">
                      {t.category}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.priority === 'urgent' && (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase text-[10px] border border-rose-200">
                          Терміновий
                        </span>
                      )}
                      {t.priority === 'high' && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          Високий
                        </span>
                      )}
                      {t.priority === 'medium' && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          Середній
                        </span>
                      )}
                      {t.priority === 'low' && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          Низький
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={(e) => onQuickToggleStatus(t, e)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : t.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isDone ? 'Виконано' : t.status === 'in_progress' ? 'В процесі' : 'Заплановано'}</span>
                      </button>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => onTaskClick(t, e)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white transition"
                          title="Редагувати"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(t.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition"
                          title="Видалити"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
