import React from 'react';
import { Calendar, Users, BarChart3, RotateCcw, Download, Grid, ListFilter, Clock, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react';
import { MONTH_NAMES_UA } from '../utils/dateUtils';

interface HeaderProps {
  year: number;
  setYear: (y: number) => void;
  monthIndex: number;
  setMonthIndex: (m: number) => void;
  activeView: 'grid' | 'list' | 'stats';
  setActiveView: (view: 'grid' | 'list' | 'stats') => void;
  onOpenWorkerModal: () => void;
  onOpenShiftManager: () => void;
  onLoadDemoData?: () => void;
  onClearData: () => void;
  onExportData: () => void;
  totalTasksCount: number;
  totalHoursCount: number;
  workersCount: number;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  year,
  setYear,
  monthIndex,
  setMonthIndex,
  activeView,
  setActiveView,
  onOpenWorkerModal,
  onOpenShiftManager,
  onLoadDemoData,
  onClearData,
  onExportData,
  totalTasksCount,
  totalHoursCount,
  workersCount,
  onUndo,
  canUndo,
}) => {
  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(year - 1);
    } else {
      setMonthIndex(monthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(year + 1);
    } else {
      setMonthIndex(monthIndex + 1);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title and Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Графік Роботи
              </h1>
              <span className="bg-blue-50 text-blue-700 text-xs font-extrabold px-2.5 py-0.5 rounded-md border border-blue-200 uppercase tracking-wide">
                {MONTH_NAMES_UA[monthIndex]} {year}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
              <span>{workersCount} Працівників</span>
              <span>•</span>
              <span>Змін: <strong className="text-slate-800">{totalTasksCount}</strong></span>
              <span>•</span>
              <span>Годин: <strong className="text-blue-600 font-bold">{totalHoursCount} год</strong></span>
            </p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          
          {/* Month & Year Navigation Picker */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
              title="Попередній місяць"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={monthIndex}
              onChange={(e) => setMonthIndex(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 text-xs px-1 py-0.5 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES_UA.map((mName, idx) => (
                <option key={idx} value={idx}>{mName}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 text-xs px-1 py-0.5 focus:outline-none cursor-pointer border-l border-slate-300 ml-1"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
              title="Наступний місяць"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setActiveView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeView === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Сітка</span>
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeView === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Список</span>
            </button>
            <button
              onClick={() => setActiveView('stats')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeView === 'stats'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Аналітика</span>
            </button>
          </div>

          {/* Shift Templates Manager Button */}
          <button
            onClick={onOpenShiftManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 transition"
            title="Налаштувати шаблони змін (Зміна 1, 2, 3...)"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Шаблони змін</span>
          </button>

          {/* Worker Manager Button */}
          <button
            onClick={onOpenWorkerModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 transition"
          >
            <Users className="w-3.5 h-3.5 text-slate-700" />
            <span>Працівники ({workersCount})</span>
          </button>

          {/* Undo Action Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              canUndo
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title="Відмінити останню дію (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Відмінити</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={onExportData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            title="Експортувати дані у файл"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Експорт</span>
          </button>

          {/* Clear Data */}
          <button
            onClick={onClearData}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition"
            title="Очистити всі завдання"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};

