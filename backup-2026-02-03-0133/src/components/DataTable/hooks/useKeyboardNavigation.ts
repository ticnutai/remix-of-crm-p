import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardNavigationProps {
  enabled: boolean;
  rowCount: number;
  columnCount: number;
  onCellFocus?: (rowIndex: number, colIndex: number) => void;
  onEnter?: (rowIndex: number, colIndex: number) => void;
  onEscape?: () => void;
}

export function useKeyboardNavigation({
  enabled,
  rowCount,
  columnCount,
  onCellFocus,
  onEnter,
  onEscape,
}: UseKeyboardNavigationProps) {
  const focusedCell = useRef<{ row: number; col: number }>({ row: 0, col: 0 });
  const tableRef = useRef<HTMLTableElement>(null);

  const moveFocus = useCallback((rowDelta: number, colDelta: number) => {
    const newRow = Math.max(0, Math.min(rowCount - 1, focusedCell.current.row + rowDelta));
    const newCol = Math.max(0, Math.min(columnCount - 1, focusedCell.current.col + colDelta));
    
    focusedCell.current = { row: newRow, col: newCol };
    onCellFocus?.(newRow, newCol);
  }, [rowCount, columnCount, onCellFocus]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global escape handler
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      // Only handle navigation if table is focused
      if (!tableRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(1, 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(0, 1); // RTL: left means next column
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(0, -1); // RTL: right means previous column
          break;
        case 'Enter':
          e.preventDefault();
          onEnter?.(focusedCell.current.row, focusedCell.current.col);
          break;
        case 'Home':
          e.preventDefault();
          if (e.ctrlKey) {
            focusedCell.current = { row: 0, col: 0 };
          } else {
            focusedCell.current.col = 0;
          }
          onCellFocus?.(focusedCell.current.row, focusedCell.current.col);
          break;
        case 'End':
          e.preventDefault();
          if (e.ctrlKey) {
            focusedCell.current = { row: rowCount - 1, col: columnCount - 1 };
          } else {
            focusedCell.current.col = columnCount - 1;
          }
          onCellFocus?.(focusedCell.current.row, focusedCell.current.col);
          break;
        case 'PageUp':
          e.preventDefault();
          moveFocus(-10, 0);
          break;
        case 'PageDown':
          e.preventDefault();
          moveFocus(10, 0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, moveFocus, onEnter, onEscape, onCellFocus, rowCount, columnCount]);

  return { tableRef, focusedCell: focusedCell.current };
}
