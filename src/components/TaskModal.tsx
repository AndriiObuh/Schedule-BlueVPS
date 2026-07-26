import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Trash2, Check, Plus, Edit2, Sparkles, User, Settings } from 'lucide-react';
import { Worker, Task, DayInfo, Priority, TaskStatus, TaskCategory, ShiftPreset } from '../types';
import { formatDateUA, calculateShiftHours } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  day: DayInfo | null;
  workers: Worker[];
  existingTasks: Task[];
  editingTask: Task | null;
  shiftPresets: ShiftPreset[];
  onOpenShiftManager: () => void;
  onSaveTask: (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLOR_OPTIONS = [
  { name: 'Синій', hex: '#2563eb' },
  { name: 'Смарагдовий', hex: '#059669' },
  { name: 'Фіолетовий', hex: '#7c3aed' },
  { name: 'Бурштиновий', hex: '#d97706' },
  { name: 'Рожевий', hex: '#e11d48' },
  { name: 'Блакитний', hex: '#0284c7' },
  { name: 'Сірий', hex: '#64748b' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  worker,
  day,
  workers,
  existingTasks,
  editingTask,
  shiftPresets,
  onOpenShiftManager,
  onSaveTask,
  onDeleteTask,
}) => {
  // Form State
  const [targetWorkerId, setTargetWorkerId] = useState(worker?.id || '');
  const [targetDate, setTargetDate] = useState(day?.dateStr || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('shift');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [hours, setHours] = useState<number>(8);
  const [color, setColor] = useState('#2563eb');
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Populate form when editing an existing task or resetting for new
  useEffect(() => {
    if (!isOpen || !worker || !day) return;

    if (editingTask) {
      const isDayOff =
        editingTask.category === 'vacation' ||
        editingTask.title.toLowerCase().includes('вихідний') ||
        editingTask.title.toLowerCase().includes('відпустка');

      const isShift3 =
        editingTask.title.includes('3 (19:00') ||
        editingTask.title.includes('Зміна 3') ||
        editingTask.title.startsWith('3 (');
      const effPriority = isShift3 && editingTask.priority === 'high' ? 'medium' : editingTask.priority;

      setTargetWorkerId(editingTask.workerId);
      setTargetDate(editingTask.date);
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(isDayOff ? 'vacation' : editingTask.category);
      setPriority(isDayOff ? 'low' : effPriority);
      setStatus(editingTask.status);
      setStartTime(isDayOff ? '00:00' : (editingTask.startTime || '08:00'));
      setEndTime(isDayOff ? '00:00' : (editingTask.endTime || '16:00'));
      setHours(isDayOff ? 0 : (editingTask.hours !== undefined ? editingTask.hours : 8));
      setColor(editingTask.color || (isDayOff ? '#e11d48' : '#2563eb'));
      setActiveTab('create');
    } else {
      setTargetWorkerId(worker.id);
      setTargetDate(day.dateStr);
      setTitle('');
      setDescription('');
      setCategory('shift');
      setPriority('medium');
      setStatus('todo');
      setStartTime('08:00');
      setEndTime('16:00');
      setHours(8);
      setColor('#2563eb');
      setActiveTab(existingTasks.length > 0 ? 'list' : 'create');
    }
  }, [editingTask, worker, day, isOpen, existingTasks.length]);

  // Dynamic check if current inputs represent a day off / vacation
  const isCurrentDayOff =
    category === 'vacation' ||
    title.toLowerCase().includes('вихідний') ||
    title.toLowerCase().includes('відпустка');

  if (!isOpen || !worker || !day) return null;

  // Handle auto-calculating hours when times change
  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (!isCurrentDayOff) {
      const calculated = calculateShiftHours(val, endTime);
      setHours(calculated);
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (!isCurrentDayOff) {
      const calculated = calculateShiftHours(startTime, val);
      setHours(calculated);
    }
  };

  // Apply quick preset template
  const handleApplyPreset = (preset: ShiftPreset) => {
    const isPresetDayOff =
      preset.id === 'preset-dayoff' ||
      preset.id === 'preset-vacation' ||
      preset.category === 'vacation' ||
      preset.title.toLowerCase().includes('вихідний') ||
      preset.title.toLowerCase().includes('відпустка');

    const isShift3 =
      preset.id === 'preset-shift-3' ||
      preset.title.includes('3 (19:00') ||
      preset.title.includes('Зміна 3') ||
      preset.title.startsWith('3 (');
    const effPriority = isShift3 && preset.priority === 'high' ? 'medium' : preset.priority;

    setTitle(preset.title);
    setCategory(isPresetDayOff ? 'vacation' : preset.category);
    setPriority(isPresetDayOff ? 'low' : effPriority);
    setStartTime(isPresetDayOff ? '00:00' : preset.startTime);
    setEndTime(isPresetDayOff ? '00:00' : preset.endTime);
    setHours(isPresetDayOff ? 0 : preset.hours);
    setColor(preset.color);
    setActiveTab('create');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const trimmedTitle = title.trim();
    const titleLower = trimmedTitle.toLowerCase();
    const isDayOff =
      category === 'vacation' ||
      titleLower.includes('вихідний') ||
      titleLower.includes('відпустка');

    onSaveTask({
      ...(editingTask ? { id: editingTask.id } : {}),
      workerId: targetWorkerId,
      date: targetDate,
      title: trimmedTitle,
      description: description.trim(),
      category: isDayOff ? 'vacation' : category,
      priority: isDayOff ? 'low' : priority,
      status,
      startTime: isDayOff ? '00:00' : startTime,
      endTime: isDayOff ? '00:00' : endTime,
      hours: isDayOff ? 0 : Number(hours),
      color,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: worker.color }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-2xs ring-1 ring-slate-200 uppercase"
            >
              {worker.name.trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingTask ? 'Редагувати завдання' : 'Призначити завдання / зміну'}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{worker.name} ({worker.role})</span>
                <span>•</span>
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-800">{formatDateUA(day.dateStr)} ({day.fullDayOfWeek})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher if there are existing tasks */}
        {existingTasks.length > 0 && !editingTask && (
          <div className="px-6 pt-3 bg-slate-50/50 border-b border-slate-200 flex items-center gap-4">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'list'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Існуючі завдання ({existingTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'create'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Додати нове завдання</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          
          {/* LIST TAB: View Existing Tasks for this worker and day */}
          {activeTab === 'list' && existingTasks.length > 0 && !editingTask ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Завдання на цей день для {worker.name}:</span>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Створити ще одне
                </button>
              </div>

              {existingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{ borderLeftColor: t.color || '#2563eb' }}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 transition"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{t.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {t.status === 'completed' ? 'Виконано' : t.status === 'in_progress' ? 'В процесі' : 'Заплановано'}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-xs text-slate-600">{t.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 font-medium">
                      {t.startTime && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {t.startTime} - {t.endTime} ({t.hours}г)
                        </span>
                      )}
                      <span className="capitalize">Категорія: {t.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        onSaveTask({ ...t, id: t.id });
                      }}
                      className="p-2 rounded-lg bg-slate-200 hover:bg-slate-900 text-slate-700 hover:text-white transition"
                      title="Редагувати"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition"
                      title="Видалити"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* CREATE / EDIT FORM */
            <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Quick Presets Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Швидкий вибір зміни / шаблону:
                  </label>

                  <button
                    type="button"
                    onClick={onOpenShiftManager}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Налаштувати зміни</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {shiftPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-800 border border-slate-200 hover:border-blue-300 transition flex items-center gap-1.5 font-bold shadow-2xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Назва завдання або зміни <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="наприклад: Зміна 1 (08:00-16:00), Зміна 2 або Чергування..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium shadow-2xs"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Категорія
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                  >
                    <option value="shift">Зміна (Робоча)</option>
                    <option value="project">Проєкт</option>
                    <option value="duty">Чергування</option>
                    <option value="maintenance">Обслуговування</option>
                    <option value="vacation">Відпустка</option>
                    <option value="other">Інше</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Пріоритет
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                  >
                    <option value="low">🟢 Низький</option>
                    <option value="medium">🔵 Середній</option>
                    <option value="high">🟠 Високий</option>
                    <option value="urgent">🔴 Терміновий</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Статус
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                  >
                    <option value="todo">Заплановано</option>
                    <option value="in_progress">В процесі</option>
                    <option value="completed">Виконано</option>
                  </select>
                </div>
              </div>

              {/* Time Range and Hours */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Час початку
                  </label>
                  <input
                    type="time"
                    value={isCurrentDayOff ? '00:00' : startTime}
                    disabled={isCurrentDayOff}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold ${
                      isCurrentDayOff ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Час кінця
                  </label>
                  <input
                    type="time"
                    value={isCurrentDayOff ? '00:00' : endTime}
                    disabled={isCurrentDayOff}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold ${
                      isCurrentDayOff ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Тривалість (годин)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    disabled={isCurrentDayOff}
                    value={isCurrentDayOff ? 0 : hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                    className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black ${
                      isCurrentDayOff
                        ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                        : 'text-blue-700'
                    }`}
                  />
                </div>
              </div>
              {isCurrentDayOff && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg font-medium">
                  ⚡ Вихідний та відпустка мають 0 робочих годин і не додаються до робочого навантаження.
                </p>
              )}

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Колір плашки
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                        color === c.hex ? 'ring-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {color === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Re-assign Worker / Change Date option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Призначити працівнику
                  </label>
                  <select
                    value={targetWorkerId}
                    onChange={(e) => setTargetWorkerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Опис / Нотатки
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Додаткові інструкції чи примітки..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {editingTask ? (
            <button
              type="button"
              onClick={() => {
                onDeleteTask(editingTask.id);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Видалити
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 transition"
            >
              Скасувати
            </button>

            <button
              type="submit"
              form="task-form"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingTask ? 'Зберегти зміни' : 'Призначити завдання'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

