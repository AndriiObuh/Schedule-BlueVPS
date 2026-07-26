import { useState, useEffect } from 'react';
import type React from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Worker, Task, ShiftPreset } from '../types';
import { INITIAL_WORKERS, DEMO_TASKS, DEFAULT_SHIFT_PRESETS } from '../data/initialData';

function cleanObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as T;
}

export function useFirestoreSchedule() {
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [shiftPresets, setShiftPresets] = useState<ShiftPreset[]>(DEFAULT_SHIFT_PRESETS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Undo history stack for tasks
  const [undoStack, setUndoStack] = useState<Task[][]>([]);

  const pushUndoSnapshot = (customTasks?: Task[]) => {
    const snapshotToSave = customTasks || tasks;
    setUndoStack((prev) => [...prev.slice(-19), snapshotToSave]);
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return false;

    const previousTasks = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    try {
      const snapTasks = await getDocs(collection(db, 'tasks'));
      const currentDocsMap = new Map(snapTasks.docs.map((d) => [d.id, d.data() as Task]));
      const prevTasksMap = new Map(previousTasks.map((t) => [t.id, t]));

      const batch = writeBatch(db);

      // 1. Delete tasks currently in DB that were not in previousTasks
      snapTasks.docs.forEach((d) => {
        if (!prevTasksMap.has(d.id)) {
          batch.delete(d.ref);
        }
      });

      // 2. Add or restore tasks from previousTasks
      previousTasks.forEach((t) => {
        const existing = currentDocsMap.get(t.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(t)) {
          batch.set(doc(db, 'tasks', t.id), cleanObject(t));
        }
      });

      await batch.commit();
      return true;
    } catch (e) {
      console.error('Failed to undo task action:', e);
      return false;
    }
  };

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const setupListeners = async () => {
      try {
        // Workers listener
        const unsubWorkers = onSnapshot(
          collection(db, 'workers'),
          async (snapshot) => {
            if (snapshot.empty) {
              // Seed initial workers if empty
              console.log('Seeding initial workers to Firestore...');
              for (const w of INITIAL_WORKERS) {
                await setDoc(doc(db, 'workers', w.id), cleanObject(w));
              }
            } else {
              const list: Worker[] = snapshot.docs.map((d) => d.data() as Worker);
              setWorkers(list);
            }
          },
          (err) => {
            console.warn('Workers onSnapshot error (operating in offline/cached mode):', err);
          }
        );
        unsubs.push(unsubWorkers);

        // Shift Presets listener
        const unsubShifts = onSnapshot(
          collection(db, 'shiftPresets'),
          async (snapshot) => {
            if (snapshot.empty) {
              // Seed initial shift presets if empty
              console.log('Seeding initial shift presets to Firestore...');
              for (const p of DEFAULT_SHIFT_PRESETS) {
                await setDoc(doc(db, 'shiftPresets', p.id), cleanObject(p));
              }
            } else {
              const list: ShiftPreset[] = snapshot.docs.map((d) => {
                const data = d.data() as ShiftPreset;
                if ((data.id === 'preset-shift-3' || data.title.includes('3 (19:00') || data.title.includes('Зміна 3')) && data.priority === 'high') {
                  const updated = { ...data, priority: 'medium' as const };
                  setDoc(doc(db, 'shiftPresets', data.id), cleanObject(updated)).catch(console.error);
                  return updated;
                }
                return data;
              });
              setShiftPresets(list);
            }
          },
          (err) => {
            console.warn('ShiftPresets onSnapshot error (operating in offline/cached mode):', err);
          }
        );
        unsubs.push(unsubShifts);

        // Tasks listener
        const unsubTasks = onSnapshot(
          collection(db, 'tasks'),
          async (snapshot) => {
            if (snapshot.empty) {
              setTasks([]);
            } else {
              const demoDocsToDelete: string[] = [];
              const list: Task[] = [];

              snapshot.docs.forEach((d) => {
                const data = d.data() as Task;
                if (data.id && data.id.startsWith('demo-')) {
                  demoDocsToDelete.push(data.id);
                } else {
                  if (
                    (data.title.includes('3 (19:00') || data.title.includes('Зміна 3') || data.title.startsWith('3 (')) &&
                    data.priority === 'high'
                  ) {
                    const updated = { ...data, priority: 'medium' as const };
                    setDoc(doc(db, 'tasks', data.id), cleanObject(updated)).catch(console.error);
                    list.push(updated);
                  } else {
                    list.push(data);
                  }
                }
              });

              if (demoDocsToDelete.length > 0) {
                const batch = writeBatch(db);
                demoDocsToDelete.forEach((id) => batch.delete(doc(db, 'tasks', id)));
                batch.commit().catch(console.error);
              }

              setTasks(list);
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Tasks onSnapshot error (operating in offline/cached mode):', err);
            setLoading(false);
          }
        );
        unsubs.push(unsubTasks);

      } catch (err) {
        console.error('Firestore listener error:', err);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Worker Mutations
  const handleAddWorker = async (newWorker: Worker) => {
    try {
      await setDoc(doc(db, 'workers', newWorker.id), cleanObject(newWorker));
    } catch (e) {
      console.error('Failed to add worker:', e);
    }
  };

  const handleUpdateWorker = async (updatedWorker: Worker) => {
    try {
      await setDoc(doc(db, 'workers', updatedWorker.id), cleanObject(updatedWorker));
    } catch (e) {
      console.error('Failed to update worker:', e);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (workers.length <= 1) return;
    try {
      await deleteDoc(doc(db, 'workers', workerId));
    } catch (e) {
      console.error('Failed to delete worker:', e);
    }
  };

  const handleResetWorkers = async () => {
    try {
      const snap = await getDocs(collection(db, 'workers'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      INITIAL_WORKERS.forEach((w) => {
        batch.set(doc(db, 'workers', w.id), cleanObject(w));
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to reset workers:', e);
    }
  };

  // Shift Presets Mutations
  const handleSaveShiftPreset = async (preset: ShiftPreset) => {
    try {
      await setDoc(doc(db, 'shiftPresets', preset.id), cleanObject(preset));
    } catch (e) {
      console.error('Failed to save shift preset:', e);
    }
  };

  const handleDeleteShiftPreset = async (presetId: string) => {
    try {
      await deleteDoc(doc(db, 'shiftPresets', presetId));
    } catch (e) {
      console.error('Failed to delete shift preset:', e);
    }
  };

  const handleResetShiftPresets = async () => {
    try {
      const snap = await getDocs(collection(db, 'shiftPresets'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      DEFAULT_SHIFT_PRESETS.forEach((p) => {
        batch.set(doc(db, 'shiftPresets', p.id), cleanObject(p));
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to reset shift presets:', e);
    }
  };

  // Tasks Mutations
  const handleSaveTask = async (
    taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }
  ) => {
    pushUndoSnapshot();
    try {
      if (taskData.id) {
        const updatedTask = cleanObject({
          ...taskData,
          id: taskData.id,
        });
        await setDoc(doc(db, 'tasks', taskData.id), updatedTask, { merge: true });
      } else {
        const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newTask = cleanObject({
          ...taskData,
          id,
          createdAt: new Date().toISOString(),
        });
        await setDoc(doc(db, 'tasks', id), newTask);
      }
    } catch (e) {
      console.error('Failed to save task:', e);
    }
  };

  const handleQuickToggleStatus = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    pushUndoSnapshot();
    const nextStatusMap: Record<string, 'todo' | 'in_progress' | 'completed'> = {
      todo: 'in_progress',
      in_progress: 'completed',
      completed: 'todo',
    };
    const nextStatus = nextStatusMap[task.status] || 'todo';
    try {
      await setDoc(doc(db, 'tasks', task.id), { status: nextStatus }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    pushUndoSnapshot();
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const handleBatchAddTasks = async (newTasksList: Omit<Task, 'id' | 'createdAt'>[]) => {
    if (!newTasksList.length) return;
    pushUndoSnapshot();
    try {
      const batch = writeBatch(db);
      newTasksList.forEach((t, idx) => {
        const id = `task-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
        const newTask = cleanObject({
          ...t,
          id,
          createdAt: new Date().toISOString(),
        });
        batch.set(doc(db, 'tasks', id), newTask);
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to batch add tasks:', e);
    }
  };

  const handleBatchDeleteTasks = async (taskIds: string[]) => {
    if (!taskIds.length) return;
    pushUndoSnapshot();
    try {
      const batch = writeBatch(db);
      taskIds.forEach((id) => {
        batch.delete(doc(db, 'tasks', id));
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to batch delete tasks:', e);
    }
  };

  const handleLoadDemoData = async () => {
    // Demo data functionality disabled - query real Firestore schedule
    try {
      const snapTasks = await getDocs(collection(db, 'tasks'));
      const batch = writeBatch(db);
      snapTasks.docs.forEach((d) => {
        if (d.id.startsWith('demo-')) {
          batch.delete(d.ref);
        }
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to clean demo data:', e);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі завдання?')) {
      pushUndoSnapshot();
      try {
        const snapTasks = await getDocs(collection(db, 'tasks'));
        const batch = writeBatch(db);
        snapTasks.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.error('Failed to clear tasks:', e);
      }
    }
  };

  return {
    workers,
    shiftPresets,
    tasks,
    loading,
    canUndo: undoStack.length > 0,
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
  };
}
