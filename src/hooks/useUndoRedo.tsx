// Global Undo/Redo System - tenarch CRM Pro
import React, { createContext, useContext, useReducer, useCallback, ReactNode, useMemo } from 'react';

export interface HistoryAction {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  maxHistory: number;
}

type HistoryReducerAction = 
  | { type: 'PUSH'; action: HistoryAction }
  | { type: 'UNDO_MOVE' }
  | { type: 'REDO_MOVE' }
  | { type: 'CLEAR' };

const initialState: HistoryState = {
  past: [],
  future: [],
  maxHistory: 50,
};

function historyReducer(state: HistoryState, action: HistoryReducerAction): HistoryState {
  switch (action.type) {
    case 'PUSH': {
      const newPast = [...state.past, action.action];
      // Limit history size
      if (newPast.length > state.maxHistory) {
        newPast.shift();
      }
      return {
        ...state,
        past: newPast,
        future: [], // Clear future on new action
      };
    }
    case 'UNDO_MOVE': {
      if (state.past.length === 0) return state;
      const lastAction = state.past.at(-1);
      if (!lastAction) return state;
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future],
      };
    }
    case 'REDO_MOVE': {
      if (state.future.length === 0) return state;
      const nextAction = state.future[0];
      return {
        ...state,
        past: [...state.past, nextAction],
        future: state.future.slice(1),
      };
    }
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface UndoRedoContextType {
  canUndo: boolean;
  canRedo: boolean;
  pastActions: HistoryAction[];
  futureActions: HistoryAction[];
  pushAction: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

const UndoRedoContext = createContext<UndoRedoContextType | null>(null);

export function UndoRedoProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(historyReducer, initialState);

  const pushAction = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
    dispatch({
      type: 'PUSH',
      action: {
        ...action,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
    });
  }, []);

  const undo = useCallback(async () => {
    const lastAction = state.past.at(-1);
    if (!lastAction) return;
    dispatch({ type: 'UNDO_MOVE' });
    try { await lastAction.undo(); } catch (e) { console.error('Undo error:', e); }
  }, [state.past]);

  const redo = useCallback(async () => {
    const nextAction = state.future[0];
    if (!nextAction) return;
    dispatch({ type: 'REDO_MOVE' });
    try { await nextAction.redo(); } catch (e) { console.error('Redo error:', e); }
  }, [state.future]);
  const clearHistory = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  // Global keyboard shortcuts for Ctrl+Z and Ctrl+Y
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const contextValue = useMemo(() => ({
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    pastActions: state.past,
    futureActions: state.future,
    pushAction,
    undo,
    redo,
    clearHistory,
  }), [state.past, state.future, pushAction, undo, redo, clearHistory]);

  return (
    <UndoRedoContext.Provider value={contextValue}>
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
}
