import React from 'react';
import { Search, Filter, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Worker, TaskCategory, Priority, TaskStatus } from '../types';

interface FilterBarProps {
  workers: Worker[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedWorkerId: string;
  setSelectedWorkerId: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPriority: string;
  setSelectedPriority: (p: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  workers,
  searchQuery,
  setSearchQuery,
  selectedWorkerId,
  setSelectedWorkerId,
  selectedCategory,
  setSelectedCategory,
  selectedPriority,
  setSelectedPriority,
  selectedStatus,
  setSelectedStatus,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-slate-700">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук завдань..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />

        {/* Worker Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">Працівник:</span>
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs font-medium"
          >
            <option value="all">Усі працівники</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.role ? `(${w.role})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">Категорія:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs font-medium"
          >
            <option value="all">Усі категорії</option>
            <option value="shift">Зміна</option>
            <option value="project">Проєкт</option>
            <option value="duty">Чергування</option>
            <option value="maintenance">Обслуговування</option>
            <option value="vacation">Відпустка</option>
            <option value="other">Інше</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">Пріоритет:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs font-medium"
          >
            <option value="all">Усі пріоритети</option>
            <option value="low">🟢 Низький</option>
            <option value="medium">🔵 Середній</option>
            <option value="high">🟠 Високий</option>
            <option value="urgent">🔴 Терміновий</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">Статус:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs font-medium"
          >
            <option value="all">Усі статуси</option>
            <option value="todo">Заплановано</option>
            <option value="in_progress">В процесі</option>
            <option value="completed">Виконано</option>
          </select>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 transition ml-auto"
          >
            <X className="w-3 h-3" />
            <span>Скинути</span>
          </button>
        )}

      </div>
    </div>
  );
};
