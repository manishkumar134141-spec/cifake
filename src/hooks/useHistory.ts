import { useState, useEffect } from 'react';
import { HistoryRecord } from '../types';

const STORAGE_KEY = 'cifake_history_records';

export function useHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback empty
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not persist history to localStorage', e);
    }
  }, [history]);

  const addRecord = (record: HistoryRecord) => {
    setHistory((prev) => [record, ...prev.slice(0, 49)]); // keep last 50
  };

  const deleteRecord = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addRecord,
    deleteRecord,
    clearHistory,
  };
}
