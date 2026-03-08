// Global Undo/Redo System - e-control CRM Pro
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
  | { type: 'UNDO' }
  | { type: 'REDO' }
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
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const lastAction = state.past.at(-1);
      if (!lastAction) return state;
      lastAction.undo();
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const nextAction = state.future[0];
      nextAction.redo();
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

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
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
        if (state.past.length > 0) {
          dispatch({ type: 'UNDO' });
        }
      }

      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (state.future.length > 0) {
          dispatch({ type: 'REDO' });
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [state.past.length, state.future.length]);

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
