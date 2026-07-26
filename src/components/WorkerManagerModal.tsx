import React, { useState } from 'react';
import { X, Users, Edit3, RotateCcw, Check, Plus, Trash2 } from 'lucide-react';
import { Worker } from '../types';

interface WorkerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onUpdateWorker: (updatedWorker: Worker) => void;
  onAddWorker: (newWorker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
  onResetWorkers: () => void;
}

const AVATAR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#7c3aed', // Purple
  '#4f46e5', // Indigo
  '#0d9488', // Teal
];

export const WorkerManagerModal: React.FC<WorkerManagerModalProps> = ({
  isOpen,
  onClose,
  workers,
  onUpdateWorker,
  onAddWorker,
  onDeleteWorker,
  onResetWorkers,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Оператор');
  const [newColor, setNewColor] = useState('#3b82f6');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newWorker: Worker = {
      id: `worker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      role: newRole.trim() || 'Працівник',
      color: newColor,
    };

    onAddWorker(newWorker);
    setNewName('');
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Керування працівниками ({workers.length})</h2>
              <p className="text-xs text-slate-500 font-medium">Змінюйте ім’я, посаду та колір аватара для кожного працівника</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker List & Add Form */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Add Worker Toggle Button or Form */}
          {!isAddingNew ? (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 px-4 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-xl text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Додати нового працівника</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900">Новий працівник</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
                >
                  Скасувати
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Прізвище та Ім’я</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="наприклад: Олександр Коваль або Діма"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Посада</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Старший майстер"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Колір аватара</label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-800' : 'hover:scale-110'
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
                  Додати працівника
                </button>
              </div>
            </form>
          )}

          {/* List of Workers */}
          <div className="space-y-3">
            {workers.map((worker) => (
              <WorkerRow
                key={worker.id}
                worker={worker}
                onSave={onUpdateWorker}
                onDelete={onDeleteWorker}
                canDelete={workers.length > 1}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onResetWorkers}
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

interface WorkerRowProps {
  worker: Worker;
  onSave: (w: Worker) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

function WorkerRow({ worker, onSave, onDelete, canDelete }: WorkerRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(worker.name);
  const [role, setRole] = useState(worker.role);
  const [color, setColor] = useState(worker.color);

  const handleSave = () => {
    onSave({
      ...worker,
      name: name.trim() || worker.name,
      role: role.trim() || worker.role,
      color,
    });
    setIsEditing(false);
  };

  const displayName = isEditing ? name : worker.name;
  const avatarLetter = displayName?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          style={{ backgroundColor: color }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-2xs shrink-0 ring-1 ring-slate-200 uppercase"
        >
          {avatarLetter}
        </div>

        {isEditing ? (
          <div className="space-y-2 flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ім’я"
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold"
            />
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Посада"
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium"
            />
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-medium">Колір:</span>
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-4 h-4 rounded-full ${color === c ? 'ring-2 ring-slate-900 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {worker.name}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium truncate">{worker.role}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
            title="Зберегти"
          >
            <Check className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
              title="Редагувати"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(worker.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Видалити працівника"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

