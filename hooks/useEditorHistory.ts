import { useCallback, useRef, useState } from 'react';
import { produce } from 'immer';
import { InvitationData } from '../types';

const MAX_HISTORY = 20;

interface HistoryState {
  past: InvitationData[];
  present: InvitationData;
  future: InvitationData[];
}

export function useEditorHistory(initial: InvitationData) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initial,
    future: [],
  });

  // Keep a ref so callbacks don't stale-close over old state
  const historyRef = useRef(history);
  historyRef.current = history;

  const push = useCallback((updater: (draft: InvitationData) => void) => {
    setHistory(h => {
      const next = produce(h.present, updater);
      if (next === h.present) return h; // no change
      return {
        past: [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const set = useCallback((data: InvitationData) => {
    setHistory(h => {
      if (data === h.present) return h; // no-op guard: skip if same reference
      return {
        past: [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
        present: data,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  const reset = useCallback((data: InvitationData) => {
    setHistory({ past: [], present: data, future: [] });
  }, []);

  return {
    data: history.present,
    push,
    set,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
