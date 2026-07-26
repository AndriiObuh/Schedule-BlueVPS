import React, { useState } from 'react';
import { X, FileSpreadsheet, Image, FileText, Database, Download, Check, Sparkles, Loader2 } from 'lucide-react';
import { Worker, Task, DayInfo } from '../types';
import { MONTH_NAMES_UA } from '../utils/dateUtils';
import {
  exportToExcelMatrix,
  exportToPngImage,
  exportToCsvList,
  exportToJsonBackup,
} from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  monthIndex: number;
  workers: Worker[];
  tasks: Task[];
  monthDays: DayInfo[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  year,
  monthIndex,
  workers,
  tasks,
  monthDays,
}) => {
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_UA[monthIndex];

  const handleExportExcel = () => {
    exportToExcelMatrix(year, monthIndex, workers, tasks, monthDays);
    setExportedFormat('excel');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  const handleExportPng = async () => {
    setIsExportingPng(true);
    // Slight timeout to let modal hide or complete state render
    await new Promise((r) => setTimeout(r, 100));
    await exportToPngImage('schedule-grid-export-area', `grafik_robuty_${monthName}_${year}.png`);
    setIsExportingPng(false);
    setExportedFormat('png');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  const handleExportCsv = () => {
    exportToCsvList(year, monthIndex, workers, tasks, monthDays);
    setExportedFormat('csv');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  const handleExportJson = () => {
    exportToJsonBackup(year, monthIndex, workers, tasks);
    setExportedFormat('json');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Експорт Графіка Роботи
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {monthName} {year} року • Obuh Schedule
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Options */}
        <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          
          {/* Option 1: Excel (.xlsx) */}
          <div
            onClick={handleExportExcel}
            className="group relative p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-900 text-sm">
                    Таблиця Excel (.xlsx)
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Матриця 1 в 1
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Повноцінна сітка графіка для Excel: Працівники × Дні місяця з підсумками годин та розрахованими змінами.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {exportedFormat === 'excel' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-xl">
                  <Check className="w-4 h-4" /> Скачано
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 bg-slate-100 group-hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition">
                  Завантажити
                </span>
              )}
            </div>
          </div>

          {/* Option 2: Image PNG (.png) */}
          <div
            onClick={handleExportPng}
            className={`group relative p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-between gap-4 ${
              isExportingPng ? 'pointer-events-none opacity-80' : ''
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                <Image className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-900 text-sm">
                    Зображення PNG (.png)
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Фото / Друк
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Високоякісний скріншот усієї сітки графіка для роздруківки або надсилання в Telegram / Viber.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {isExportingPng ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin" /> Обробка...
                </span>
              ) : exportedFormat === 'png' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-xl">
                  <Check className="w-4 h-4" /> Скачано
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 bg-slate-100 group-hover:bg-blue-100 px-3 py-1.5 rounded-xl transition">
                  Зберегти PNG
                </span>
              )}
            </div>
          </div>

          {/* Option 3: CSV (.csv) */}
          <div
            onClick={handleExportCsv}
            className="group relative p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white hover:bg-amber-50/40 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-amber-900 text-sm">
                    Таблиця CSV (.csv)
                  </h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Списковий CSV
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Повний списковий формат усіх записів із годинами, пріоритетами, статусами для обробки та аналізу.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {exportedFormat === 'csv' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-xl">
                  <Check className="w-4 h-4" /> Скачано
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-700 group-hover:text-amber-700 bg-slate-100 group-hover:bg-amber-100 px-3 py-1.5 rounded-xl transition">
                  Завантажити
                </span>
              )}
            </div>
          </div>

          {/* Option 4: Backup JSON (.json) */}
          <div
            onClick={handleExportJson}
            className="group relative p-4 rounded-2xl border-2 border-slate-200 hover:border-purple-500 bg-white hover:bg-purple-50/40 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-purple-900 text-sm">
                    Резервна копія JSON (.json)
                  </h3>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Повний бекап
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Повний системний бекап працівників та завдань для збереження чи переносу на інший комп'ютер.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {exportedFormat === 'json' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1.5 rounded-xl">
                  <Check className="w-4 h-4" /> Скачано
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-700 group-hover:text-purple-700 bg-slate-100 group-hover:bg-purple-100 px-3 py-1.5 rounded-xl transition">
                  Завантажити
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Всі файли формуються миттєво в браузері
          </p>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Закрити
          </button>
        </div>

      </div>
    </div>
  );
};
