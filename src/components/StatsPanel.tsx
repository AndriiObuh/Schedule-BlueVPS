import React from 'react';
import { BarChart3, Clock, CheckCircle2, AlertCircle, Users, Calendar } from 'lucide-react';
import { Worker, Task, DayInfo } from '../types';
import { isDayOffTask, getShiftPluralUA } from '../utils/dateUtils';

interface StatsPanelProps {
  workers: Worker[];
  tasks: Task[];
  days: DayInfo[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ workers, tasks, days }) => {
  const currentMonthDateStrs = new Set(days.map((d) => d.dateStr));
  const monthTasks = tasks.filter((t) => currentMonthDateStrs.has(t.date));
  const workingTasks = monthTasks.filter((t) => !isDayOffTask(t));

  const totalTasks = workingTasks.length;
  const totalHours = workingTasks.reduce((sum, t) => sum + (t.hours || 0), 0);
  const completedTasks = workingTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = workingTasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = workingTasks.filter((t) => t.status === 'todo').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate daily workload (shift count per day)
  const dailyWorkload = days.map((day) => {
    const dayTasks = workingTasks.filter((t) => t.date === day.dateStr);
    const dayHours = dayTasks.reduce((sum, t) => sum + (t.hours || 0), 0);
    return {
      dayNumber: day.dayNumber,
      dayOfWeek: day.dayOfWeek,
      isWeekend: day.isWeekend,
      taskCount: dayTasks.length,
      hours: dayHours,
    };
  });

  const maxDailyHours = Math.max(...dailyWorkload.map((d) => d.hours), 1);

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6 text-slate-900">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Всього змін</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalTasks}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Для {workers.length} працівників</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Заплановано годин</p>
            <h3 className="text-2xl font-black text-blue-700 mt-0.5">{totalHours} год</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Середньо ~{workers.length ? Math.round(totalHours / workers.length) : 0}г на працівника</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Виконано змін</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{completionRate}%</h3>
            <p className="text-[11px] text-emerald-700 mt-0.5 font-semibold">{completedTasks} з {totalTasks} {getShiftPluralUA(totalTasks)} завершено</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">В процесі / Очікує</p>
            <h3 className="text-2xl font-black text-amber-700 mt-0.5">{inProgressTasks + todoTasks}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{inProgressTasks} в процесі, {todoTasks} заплановано</p>
          </div>
        </div>

      </div>

      {/* Per Worker Workload Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Навантаження по працівниках
          </h3>
          <span className="text-xs text-slate-500 font-medium">Норма: ~160 годин / місяць</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {workers.map((worker) => {
            const workerTasks = workingTasks.filter((t) => t.workerId === worker.id);
            const workerHours = workerTasks.reduce((sum, t) => sum + (t.hours || 0), 0);
            const workerDone = workerTasks.filter((t) => t.status === 'completed').length;
            const percentageOfStandard = Math.min(Math.round((workerHours / 160) * 100), 100);

            return (
              <div
                key={worker.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: worker.color }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-2xs uppercase"
                  >
                    {worker.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{worker.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{worker.role}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Годин:</span>
                    <span className="font-bold text-blue-700">{workerHours} год</span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${percentageOfStandard}%`,
                        backgroundColor: worker.color,
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-medium">
                    <span>Змін: {workerTasks.length}</span>
                    <span className="text-emerald-700 font-bold">{workerDone} виконано</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* August Daily Workload Visual Timeline Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Розподіл робочого часу за днями
          </h3>
          <span className="text-xs text-slate-500 font-medium">Графік завантаженості команди</span>
        </div>

        <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 pb-2 overflow-x-auto custom-scrollbar">
          {dailyWorkload.map((day) => {
            const heightPercent = Math.max((day.hours / maxDailyHours) * 100, 4);

            return (
              <div
                key={day.dayNumber}
                className="flex-1 min-w-[24px] flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl pointer-events-none z-20 whitespace-nowrap">
                  <p className="font-bold">{day.dayNumber} ({day.dayOfWeek})</p>
                  <p className="text-blue-300">Змін: {day.taskCount}</p>
                  <p className="text-emerald-300">Годин: {day.hours}г</p>
                </div>

                {/* Hours Label */}
                {day.hours > 0 && (
                  <span className="text-[9px] font-bold text-slate-600 mb-1 group-hover:text-blue-600">
                    {day.hours}г
                  </span>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    day.hours > 0
                      ? day.isWeekend
                        ? 'bg-rose-500 shadow-2xs'
                        : 'bg-blue-600 shadow-2xs'
                      : 'bg-slate-200'
                  }`}
                />

                {/* Day label */}
                <span className={`text-[10px] mt-2 font-semibold ${
                  day.isWeekend ? 'text-rose-600' : 'text-slate-500'
                }`}>
                  {day.dayNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
