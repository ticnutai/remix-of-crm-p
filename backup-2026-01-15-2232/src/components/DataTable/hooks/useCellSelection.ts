import { useState, useCallback, useEffect } from 'react';

export interface CellPosition {
  rowIndex: number;
  columnId: string;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface MergedCell {
  id: string;
  startRow: number;
  endRow: number;
  startColumn: string;
  endColumn: string;
  value: any;
}

export interface UseCellSelectionProps {
  enabled?: boolean;
  columns: { id: string }[];
  rowCount: number;
}

export function useCellSelection({ enabled = true, columns, rowCount }: UseCellSelectionProps) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [mergedCells, setMergedCells] = useState<MergedCell[]>([]);
  const [frozenRows, setFrozenRows] = useState<number>(0);

  const getCellId = useCallback((rowIndex: number, columnId: string) => {
    return `${rowIndex}-${columnId}`;
  }, []);

  const parseCellId = useCallback((cellId: string): CellPosition => {
    const [rowIndex, columnId] = cellId.split('-');
    return { rowIndex: parseInt(rowIndex), columnId };
  }, []);

  const getColumnIndex = useCallback((columnId: string) => {
    return columns.findIndex(c => c.id === columnId);
  }, [columns]);

  const getCellsInRange = useCallback((start: CellPosition, end: CellPosition): string[] => {
    const cells: string[] = [];
    const startRowIndex = Math.min(start.rowIndex, end.rowIndex);
    const endRowIndex = Math.max(start.rowIndex, end.rowIndex);
    const startColIndex = Math.min(getColumnIndex(start.columnId), getColumnIndex(end.columnId));
    const endColIndex = Math.max(getColumnIndex(start.columnId), getColumnIndex(end.columnId));

    for (let row = startRowIndex; row <= endRowIndex; row++) {
      for (let col = startColIndex; col <= endColIndex; col++) {
        if (columns[col]) {
          cells.push(getCellId(row, columns[col].id));
        }
      }
    }
    return cells;
  }, [columns, getColumnIndex, getCellId]);

  const startSelection = useCallback((position: CellPosition, addToSelection = false) => {
    if (!enabled) return;
    
    setIsSelecting(true);
    setSelectionStart(position);
    
    const cellId = getCellId(position.rowIndex, position.columnId);
    
    if (addToSelection) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellId)) {
          newSet.delete(cellId);
        } else {
          newSet.add(cellId);
        }
        return newSet;
      });
    } else {
      setSelectedCells(new Set([cellId]));
    }
  }, [enabled, getCellId]);

  const extendSelection = useCallback((position: CellPosition) => {
    if (!enabled || !isSelecting || !selectionStart) return;
    
    const cellsInRange = getCellsInRange(selectionStart, position);
    setSelectedCells(new Set(cellsInRange));
  }, [enabled, isSelecting, selectionStart, getCellsInRange]);

  const endSelection = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const selectRange = useCallback((start: CellPosition, end: CellPosition) => {
    const cells = getCellsInRange(start, end);
    setSelectedCells(new Set(cells));
  }, [getCellsInRange]);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setSelectionStart(null);
  }, []);

  const selectAll = useCallback(() => {
    const allCells: string[] = [];
    for (let row = 0; row < rowCount; row++) {
      for (const col of columns) {
        allCells.push(getCellId(row, col.id));
      }
    }
    setSelectedCells(new Set(allCells));
  }, [rowCount, columns, getCellId]);

  const isCellSelected = useCallback((rowIndex: number, columnId: string) => {
    return selectedCells.has(getCellId(rowIndex, columnId));
  }, [selectedCells, getCellId]);

  // Merge selected cells
  const mergeCells = useCallback(() => {
    if (selectedCells.size < 2) return;

    const positions = Array.from(selectedCells).map(parseCellId);
    const minRow = Math.min(...positions.map(p => p.rowIndex));
    const maxRow = Math.max(...positions.map(p => p.rowIndex));
    const colIndices = positions.map(p => getColumnIndex(p.columnId));
    const minColIndex = Math.min(...colIndices);
    const maxColIndex = Math.max(...colIndices);

    const newMerge: MergedCell = {
      id: `merge-${Date.now()}`,
      startRow: minRow,
      endRow: maxRow,
      startColumn: columns[minColIndex].id,
      endColumn: columns[maxColIndex].id,
      value: null, // Will be set when merging
    };

    setMergedCells(prev => [...prev, newMerge]);
    clearSelection();
  }, [selectedCells, parseCellId, getColumnIndex, columns, clearSelection]);

  // Unmerge cells
  const unmergeCells = useCallback((mergeId: string) => {
    setMergedCells(prev => prev.filter(m => m.id !== mergeId));
  }, []);

  // Check if cell is part of a merge
  const getMergedCellInfo = useCallback((rowIndex: number, columnId: string) => {
    const colIndex = getColumnIndex(columnId);
    
    for (const merge of mergedCells) {
      const mergeStartColIndex = getColumnIndex(merge.startColumn);
      const mergeEndColIndex = getColumnIndex(merge.endColumn);
      
      if (
        rowIndex >= merge.startRow &&
        rowIndex <= merge.endRow &&
        colIndex >= mergeStartColIndex &&
        colIndex <= mergeEndColIndex
      ) {
        const isOrigin = rowIndex === merge.startRow && colIndex === mergeStartColIndex;
        return {
          isMerged: true,
          isOrigin,
          merge,
          rowSpan: isOrigin ? merge.endRow - merge.startRow + 1 : 0,
          colSpan: isOrigin ? mergeEndColIndex - mergeStartColIndex + 1 : 0,
        };
      }
    }
    return null;
  }, [mergedCells, getColumnIndex]);

  // Freeze rows
  const setFrozenRowCount = useCallback((count: number) => {
    setFrozenRows(Math.max(0, Math.min(count, rowCount)));
  }, [rowCount]);

  // Keyboard handling for selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ctrl+A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, selectAll, clearSelection]);

  // Mouse up handler to end selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting) {
        endSelection();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isSelecting, endSelection]);

  return {
    selectedCells,
    isSelecting,
    mergedCells,
    frozenRows,
    startSelection,
    extendSelection,
    endSelection,
    selectRange,
    clearSelection,
    selectAll,
    isCellSelected,
    mergeCells,
    unmergeCells,
    getMergedCellInfo,
    setFrozenRowCount,
    getCellId,
  };
}
