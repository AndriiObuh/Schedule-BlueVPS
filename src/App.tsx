/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Worker, Task, DayInfo } from './types';
import { getMonthDays, isDayOffTask } from './utils/dateUtils';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { ScheduleGrid } from './components/ScheduleGrid';
import { TaskModal } from './components/TaskModal';
import { WorkerManagerModal } from './components/WorkerManagerModal';
import { ShiftManagerModal } from './components/ShiftManagerModal';
import { StatsPanel } from './components/StatsPanel';
import { TaskListTable } from './components/TaskListTable';
import { ExportModal } from './components/ExportModal';
import { useFirestoreSchedule } from './hooks/useFirestoreSchedule';

export default function App() {
  const [year, setYear] = useState<number>(2026);
  const [monthIndex, setMonthIndex] = useState<number>(7); // Default August (0-indexed: 7)
  const [activeView, setActiveView] = useState<'grid' | 'list' | 'stats'>('grid');

  // Real-time Cloud Firestore data hook
  const {
    workers,
    shiftPresets,
    tasks,
    loading,
    canUndo,
    handleUndo,
    handleAddWorker,
    handleUpdateWorker,
    handleDeleteWorker,
    handleResetWorkers,
    handleSaveShiftPreset,
    handleDeleteShiftPreset,
    handleResetShiftPresets,
    handleSaveTask,
    handleBatchAddTasks,
    handleQuickToggleStatus,
    handleDeleteTask,
    handleBatchDeleteTasks,
    handleLoadDemoData,
    handleClearData,
  } = useFirestoreSchedule();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalWorker, setModalWorker] = useState<Worker | null>(null);
  const [modalDay, setModalDay] = useState<DayInfo | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isShiftManagerOpen, setIsShiftManagerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Generate Month Days for selected month & year
  const monthDays = useMemo(() => getMonthDays(year, monthIndex), [year, monthIndex]);
  const monthDateStrs = useMemo(() => new Set(monthDays.map((d) => d.dateStr)), [monthDays]);

  // Filter tasks based on current month, search & filter selections
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Month Filter: task must belong to current selected month
      if (!monthDateStrs.has(task.date)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Worker Filter
      if (selectedWorkerId !== 'all' && task.workerId !== selectedWorkerId) {
        return false;
      }

      // Category Filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // Priority Filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'all' && task.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [tasks, monthDateStrs, searchQuery, selectedWorkerId, selectedCategory, selectedPriority, selectedStatus]);

  // Check if any filter is active
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedWorkerId !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPriority !== 'all' ||
    selectedStatus !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedWorkerId('all');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
  };

  // Cell Click Handler -> Open Modal for Worker & Day
  const handleCellClick = (worker: Worker, day: DayInfo) => {
    setModalWorker(worker);
    setModalDay(day);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Task Badge Click Handler -> Edit existing task
  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent cell click triggering
    const worker = workers.find((w) => w.id === task.workerId) || workers[0];
    const day = monthDays.find((d) => d.dateStr === task.date) || monthDays[0];
    setModalWorker(worker);
    setModalDay(day);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Open Export Modal
  const handleExportData = () => {
    setIsExportModalOpen(true);
  };

  // Current Month Tasks (unfiltered by search/status for header summary)
  const currentMonthTasks = useMemo(() => {
    return tasks.filter((t) => monthDateStrs.has(t.date));
  }, [tasks, monthDateStrs]);

  // Working Month Tasks (excluding day offs / vacations)
  const workingMonthTasks = useMemo(() => {
    return currentMonthTasks.filter((t) => !isDayOffTask(t));
  }, [currentMonthTasks]);

  // Total Hours & Tasks for current month
  const totalHoursCount = workingMonthTasks.reduce((sum, t) => sum + (t.hours || 0), 0);
  const totalTasksCount = workingMonthTasks.length;

  // Existing tasks for selected modal worker & day
  const modalExistingTasks = useMemo(() => {
    if (!modalWorker || !modalDay) return [];
    return tasks.filter(
      (t) => t.workerId === modalWorker.id && t.date === modalDay.dateStr
    );
  }, [modalWorker, modalDay, tasks]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        year={year}
        setYear={setYear}
        monthIndex={monthIndex}
        setMonthIndex={setMonthIndex}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenWorkerModal={() => setIsWorkerModalOpen(true)}
        onOpenShiftManager={() => setIsShiftManagerOpen(true)}
        onLoadDemoData={handleLoadDemoData}
        onClearData={handleClearData}
        onExportData={handleExportData}
        totalTasksCount={totalTasksCount}
        totalHoursCount={totalHoursCount}
        workersCount={workers.length}
        canUndo={canUndo}
        onUndo={handleUndo}
      />

      {/* Filter & Search Bar */}
      <FilterBar
        workers={workers}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedWorkerId={selectedWorkerId}
        setSelectedWorkerId={setSelectedWorkerId}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {activeView === 'grid' && (
          <ScheduleGrid
            workers={workers}
            days={monthDays}
            tasks={filteredTasks}
            onCellClick={handleCellClick}
            onTaskClick={handleTaskClick}
            onQuickToggleStatus={handleQuickToggleStatus}
            selectedWorkerIdFilter={selectedWorkerId}
            onBatchAddTasks={handleBatchAddTasks}
            onBatchDeleteTasks={handleBatchDeleteTasks}
            onUndo={handleUndo}
          />
        )}

        {activeView === 'list' && (
          <TaskListTable
            tasks={filteredTasks}
            workers={workers}
            onTaskClick={handleTaskClick}
            onQuickToggleStatus={handleQuickToggleStatus}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeView === 'stats' && (
          <StatsPanel
            workers={workers}
            tasks={tasks}
            days={monthDays}
          />
        )}
      </main>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        worker={modalWorker}
        day={modalDay}
        workers={workers}
        existingTasks={modalExistingTasks}
        editingTask={editingTask}
        shiftPresets={shiftPresets}
        onOpenShiftManager={() => {
          setIsTaskModalOpen(false);
          setIsShiftManagerOpen(true);
        }}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Worker Manager Modal */}
      <WorkerManagerModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        workers={workers}
        onUpdateWorker={handleUpdateWorker}
        onAddWorker={handleAddWorker}
        onDeleteWorker={handleDeleteWorker}
        onResetWorkers={handleResetWorkers}
      />

      {/* Shift Templates Manager Modal */}
      <ShiftManagerModal
        isOpen={isShiftManagerOpen}
        onClose={() => setIsShiftManagerOpen(false)}
        shiftPresets={shiftPresets}
        onSavePreset={handleSaveShiftPreset}
        onDeletePreset={handleDeleteShiftPreset}
        onResetPresets={handleResetShiftPresets}
      />

      {/* Multi-format Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        year={year}
        monthIndex={monthIndex}
        workers={workers}
        tasks={tasks}
        monthDays={monthDays}
      />
    </div>
  );
}

