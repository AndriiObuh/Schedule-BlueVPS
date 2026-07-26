import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, RotateCcw, Check, Pencil } from 'lucide-react';
import { ShiftPreset, TaskCategory, Priority } from '../types';
import { calculateShiftHours } from '../utils/dateUtils';

interface ShiftManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftPresets: ShiftPreset[];
  onSavePreset: (preset: ShiftPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onResetPresets: () => void;
}

const COLOR_OPTIONS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#64748b', // Slate
];

interface ShiftPresetRowProps {
  preset: ShiftPreset;
  onSave: (preset: ShiftPreset) => void;
  onDelete: (id: string) => void;
}

const ShiftPresetRow: React.FC<ShiftPresetRowProps> = ({ preset, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(preset.title);
  const [startTime, setStartTime] = useState(preset.startTime);
  const [endTime, setEndTime] = useState(preset.endTime);
  const [hours, setHours] = useState(preset.hours);
  const [color, setColor] = useState(preset.color);

  const isMandatory =
    preset.id === 'preset-dayoff' ||
    preset.id === 'preset-vacation' ||
    preset.category === 'vacation' ||
    preset.title.toLowerCase().includes('вихідний') ||
    preset.title.toLowerCase().includes('відпустка');

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (isMandatory) {
      setHours(0);
    } else {
      const calculated = calculateShiftHours(val, endTime);
      setHours(calculated);
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (isMandatory) {
      setHours(0);
    } else {
      const calculated = calculateShiftHours(startTime, val);
      setHours(calculated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...preset,
      title: title.trim(),
      startTime: isMandatory ? '00:00' : startTime,
      endTime: isMandatory ? '00:00' : endTime,
      hours: isMandatory ? 0 : Number(hours) || 0,
      priority: isMandatory ? 'low' : preset.priority,
      category: isMandatory ? 'vacation' : preset.category,
      color,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
        <div className="flex items-center justify-between border-b border-blue-100 pb-2">
          <span className="text-xs font-bold text-blue-950">
            {isMandatory ? 'Редагування системного шаблону' : 'Редагування зміни'}
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Скасувати
          </button>
        </div>

        {isMandatory && (
          <p className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg font-medium">
            ⚡ Це обов&apos;язковий шаблон (Вихідний / Відпустка). Він завжди має 0 годин, не рахується як звичайна зміна та не має пріоритету.
          </p>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Назва шаблону</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!isMandatory && (
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Початок</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Кінець</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Годин</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Колір плашки</label>
          <div className="flex items-center gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-800' : 'hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="px-3.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Зберегти</span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-300 transition">
      <div className="flex items-center gap-3">
        <div
          style={{ backgroundColor: preset.color }}
          className="w-4 h-8 rounded-md shrink-0 shadow-2xs"
        />
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span>{preset.title}</span>
            {isMandatory && (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                Обов&apos;язковий шаблон
              </span>
            )}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
            {isMandatory ? (
              <span>0 годин • Не рахується як зміна • Без пріоритету</span>
            ) : (
              <>
                <span>Час: {preset.startTime} – {preset.endTime}</span>
                <span>•</span>
                <span>Тривалість: <strong>{preset.hours}г</strong></span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
          title="Редагувати шаблон"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {!isMandatory ? (
          <button
            onClick={() => onDelete(preset.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Видалити шаблон"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <span className="p-1.5 text-[10px] font-bold text-slate-400 cursor-default" title="Обов'язковий шаблон не можна видалити">
            🔒
          </span>
        )}
      </div>
    </div>
  );
};

export const ShiftManagerModal: React.FC<ShiftManagerModalProps> = ({
  isOpen,
  onClose,
  shiftPresets,
  onSavePreset,
  onDeletePreset,
  onResetPresets,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State for new preset
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [hours, setHours] = useState(8);
  const [color, setColor] = useState('#2563eb');
  const [category] = useState<TaskCategory>('shift');
  const [priority] = useState<Priority>('medium');

  if (!isOpen) return null;

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    const calculated = calculateShiftHours(val, endTime);
    setHours(calculated);
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    const calculated = calculateShiftHours(startTime, val);
    setHours(calculated);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPreset: ShiftPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      startTime,
      endTime,
      hours: Number(hours) || 8,
      color,
      category,
      priority,
    };

    onSavePreset(newPreset);
    setTitle('');
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Налаштування змін та шаблонів</h2>
              <p className="text-xs text-slate-500 font-medium">Створюйте та редагуйте графіки shifts (Зміна 1, 2, Нічна тощо)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Action to create new preset */}
          {!isAddingNew ? (
            <button
              onClick={() => {
                setTitle('Зміна 4 (00:00–08:00)');
                setStartTime('00:00');
                setEndTime('08:00');
                setHours(8);
                setIsAddingNew(true);
              }}
              className="w-full py-2.5 px-4 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-xl text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Додати нову зміну / шаблон</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900">Створення нового шаблону зміни</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
                >
                  Скасувати
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Назва зміни (наприклад: Зміна 1 (08:00-16:00))
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Зміна 1 (08:00-16:00)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Початок</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Кінець</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Годин</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Колір плашки</label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-800' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                >
                  Зберегти шаблон
                </button>
              </div>
            </form>
          )}

          {/* List of Presets */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Наявні шаблони змін ({shiftPresets.length})
            </h3>

            {shiftPresets.map((preset) => (
              <ShiftPresetRow
                key={preset.id}
                preset={preset}
                onSave={onSavePreset}
                onDelete={onDeletePreset}
              />
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onResetPresets}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Скинути за замовчуванням
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-2xs"
          >
            Готово
          </button>
        </div>

      </div>
    </div>
  );
};

