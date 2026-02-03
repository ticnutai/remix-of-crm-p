import { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualScrollOptions {
  enabled: boolean;
  data: any[];
  rowHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  enabled,
  data,
  rowHeight,
  overscan = 10, // Increased default for smoother scrolling
}: UseVirtualScrollOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize the row count to prevent unnecessary recalculations
  const rowCount = useMemo(() => enabled ? data.length : 0, [enabled, data.length]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan,
    // Enable smooth scrolling behavior
    scrollPaddingStart: 0,
    scrollPaddingEnd: 0,
  });

  const virtualItems = enabled ? virtualizer.getVirtualItems() : [];
  const totalSize = enabled ? virtualizer.getTotalSize() : 0;

  // Get the actual rows to render - optimized for performance
  const virtualRows = useMemo(() => {
    if (!enabled) {
      return data.map((item, index) => ({
        index,
        item,
        style: {},
      }));
    }

    // Only render visible rows + overscan for efficiency
    return virtualItems.map((virtualRow) => ({
      index: virtualRow.index,
      item: data[virtualRow.index],
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      },
    }));
  }, [enabled, data, virtualItems]);

  // Scroll to row helper
  const scrollToRow = useCallback((index: number) => {
    if (enabled) {
      virtualizer.scrollToIndex(index, { align: 'center' });
    }
  }, [enabled, virtualizer]);

  return {
    parentRef,
    virtualRows,
    totalSize,
    isVirtual: enabled,
    scrollToRow,
    virtualizer,
  };
}
