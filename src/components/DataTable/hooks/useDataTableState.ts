import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DataTableProps, DataTableState, SortState, FilterState, ColumnDef } from '../types';

// Cache for nested value access
const valueCache = new WeakMap<object, Map<string, any>>();

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Try cache first
  let cache = valueCache.get(obj);
  if (cache?.has(path)) {
    return cache.get(path);
  }
  
  const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
  
  // Store in cache
  if (!cache) {
    cache = new Map();
    valueCache.set(obj, cache);
  }
  cache.set(path, value);
  
  return value;
}

// Custom hook for debounced search with longer delay
function useDebouncedValue<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useDataTableState<T>(props: DataTableProps<T>) {
  const {
    data,
    columns,
    defaultSort = [],
    pageSize: initialPageSize = 10,
  } = props;

  const [state, setState] = useState<DataTableState<T>>({
    data,
    filteredData: data,
    sortedData: data,
    displayData: data,
    selectedRows: new Set(),
    expandedRows: new Set(),
    sorts: defaultSort,
    filters: [],
    globalSearchTerm: '',
    currentPage: 1,
    pageSize: initialPageSize,
    columnWidths: {},
    columnOrder: columns.map(c => c.id),
    hiddenColumns: new Set(columns.filter(c => c.hidden).map(c => c.id)),
    editingCell: null,
  });

  // Update data when props change
  useEffect(() => {
    setState(prev => ({ ...prev, data }));
  }, [data]);

  // Memoize columns.length and column IDs to prevent excessive updates
  const columnIds = useMemo(() => columns.map(c => c.id), [columns]);
  const columnIdsKey = columnIds.join(',');

  // Keep column order/visibility in sync when columns are added/removed dynamically
  useEffect(() => {
    setState(prev => {
      // Preserve existing order for columns that still exist
      const preservedOrder = prev.columnOrder.filter(id => columnIds.includes(id));

      // Append any new columns at the end
      const missing = columnIds.filter(id => !preservedOrder.includes(id));
      const nextOrder = [...preservedOrder, ...missing];

      // Drop hidden state for removed columns, and apply default hidden flags for new columns
      const nextHidden = new Set(Array.from(prev.hiddenColumns).filter(id => columnIds.includes(id)));
      for (const col of columns) {
        if (col.hidden) nextHidden.add(col.id);
      }

      // Avoid state updates if nothing changed
      const orderChanged =
        nextOrder.length !== prev.columnOrder.length ||
        nextOrder.some((id, i) => id !== prev.columnOrder[i]);

      const hiddenChanged =
        nextHidden.size !== prev.hiddenColumns.size ||
        Array.from(nextHidden).some(id => !prev.hiddenColumns.has(id));

      if (!orderChanged && !hiddenChanged) return prev;

      return {
        ...prev,
        columnOrder: nextOrder,
        hiddenColumns: nextHidden,
      };
    });
    // Use columnIdsKey instead of columns object to avoid unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnIdsKey]);

  // Debounce search term for performance - longer delay
  const debouncedSearchTerm = useDebouncedValue(state.globalSearchTerm, 350);

  // Pre-compute searchable column accessors for performance
  const searchableAccessors = useMemo(() => 
    columns.map(col => col.accessorKey as string).filter(Boolean),
    [columns]
  );

  // Filter data - optimized
  const filteredData = useMemo(() => {
    // Early return if no filtering needed
    if (!debouncedSearchTerm && state.filters.length === 0) {
      return state.data;
    }

    let result = state.data;

    // Apply global search with debounced term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(row => {
        // Use pre-computed accessors for faster lookup
        for (const accessor of searchableAccessors) {
          const value = getNestedValue(row, accessor);
          if (value != null && String(value).toLowerCase().includes(term)) {
            return true;
          }
        }
        return false;
      });
    }

    // Apply column filters - batch all filters in single pass
    if (state.filters.length > 0) {
      result = result.filter(row => {
        return state.filters.every(filter => {
          const value = getNestedValue(row, filter.columnId);
          const filterValue = filter.value;

          switch (filter.operator) {
            case 'eq':
              return value === filterValue;
            case 'neq':
              return value !== filterValue;
            case 'gt':
              return value > (filterValue as number);
            case 'gte':
              return value >= (filterValue as number);
            case 'lt':
              return value < (filterValue as number);
            case 'lte':
              return value <= (filterValue as number);
            case 'contains':
              const filterStr = String(filterValue);
              if (filterStr.includes('|')) {
                const values = filterStr.split('|');
                const lowerValue = String(value).toLowerCase();
                return values.some(v => lowerValue === v.toLowerCase());
              }
              return String(value).toLowerCase().includes(filterStr.toLowerCase());
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
            default:
              return true;
          }
        });
      });
    }

    return result;
  }, [state.data, debouncedSearchTerm, state.filters, searchableAccessors]);

  // Sort data - optimized with stable sort
  const sortedData = useMemo(() => {
    if (state.sorts.length === 0) return filteredData;

    // Pre-cache all sort values for better performance with large datasets
    const sortConfigs = state.sorts.map(sort => ({
      columnId: sort.columnId,
      direction: sort.direction === 'asc' ? 1 : -1,
    }));

    // Create array with indices for stable sort
    const indexedData = filteredData.map((item, index) => ({ item, index }));
    
    indexedData.sort((a, b) => {
      for (const config of sortConfigs) {
        const aVal = getNestedValue(a.item, config.columnId);
        const bVal = getNestedValue(b.item, config.columnId);

        // Handle null/undefined values - put them at the end
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        if (aVal === bVal) continue;

        // Fast numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * config.direction;
        }

        // String comparison - avoid localeCompare for pure ASCII when possible
        const aStr = String(aVal);
        const bStr = String(bVal);
        
        // Simple comparison first (faster for most cases)
        if (aStr < bStr) return -1 * config.direction;
        if (aStr > bStr) return 1 * config.direction;
      }
      // Stable sort: preserve original order for equal items
      return a.index - b.index;
    });

    return indexedData.map(({ item }) => item);
  }, [filteredData, state.sorts]);

  // Paginate data
  const displayData = useMemo(() => {
    if (!props.paginated) return sortedData;

    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, state.currentPage, state.pageSize, props.paginated]);

  // Visible columns
  const visibleColumns = useMemo(() => {
    const result = state.columnOrder
      .filter(id => !state.hiddenColumns.has(id))
      .map(id => {
        const found = columns.find(c => c.id === id);
        if (!found) {
          console.warn('[useDataTableState] Column not found for id:', id);
        }
        return found!;
      })
      .filter(Boolean);
    
    return result;
  }, [columns, state.columnOrder, state.hiddenColumns]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.ceil(sortedData.length / state.pageSize);
  }, [sortedData.length, state.pageSize]);

  // Actions
  const setGlobalSearch = useCallback((term: string) => {
    setState(prev => ({ ...prev, globalSearchTerm: term, currentPage: 1 }));
  }, []);

  const setSort = useCallback((columnId: string, multiSort = false) => {
    setState(prev => {
      const existingSort = prev.sorts.find(s => s.columnId === columnId);
      let newSorts: SortState[];

      if (existingSort) {
        if (existingSort.direction === 'asc') {
          newSorts = prev.sorts.map(s =>
            s.columnId === columnId ? { ...s, direction: 'desc' as const } : s
          );
        } else {
          newSorts = prev.sorts.filter(s => s.columnId !== columnId);
        }
      } else {
        const newSort: SortState = { columnId, direction: 'asc' };
        newSorts = multiSort ? [...prev.sorts, newSort] : [newSort];
      }

      return { ...prev, sorts: newSorts };
    });
  }, []);

  const setFilter = useCallback((filter: FilterState) => {
    setState(prev => {
      const existingIndex = prev.filters.findIndex(f => f.columnId === filter.columnId);
      let newFilters: FilterState[];

      if (filter.value === null || filter.value === '') {
        newFilters = prev.filters.filter(f => f.columnId !== filter.columnId);
      } else if (existingIndex >= 0) {
        newFilters = prev.filters.map((f, i) => (i === existingIndex ? filter : f));
      } else {
        newFilters = [...prev.filters, filter];
      }

      return { ...prev, filters: newFilters, currentPage: 1 };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: [], globalSearchTerm: '', currentPage: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: Math.max(1, Math.min(page, totalPages)) }));
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
  }, []);

  const toggleRowSelection = useCallback((index: number) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedRows);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        if (!props.multiSelect) {
          newSelected.clear();
        }
        newSelected.add(index);
      }
      return { ...prev, selectedRows: newSelected };
    });
  }, [props.multiSelect]);

  const selectAll = useCallback(() => {
    setState(prev => {
      const allSelected = prev.selectedRows.size === displayData.length;
      return {
        ...prev,
        selectedRows: allSelected ? new Set() : new Set(displayData.map((_, i) => i)),
      };
    });
  }, [displayData.length]);

  const toggleRowExpansion = useCallback((index: number) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedRows);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      return { ...prev, expandedRows: newExpanded };
    });
  }, []);

  const setColumnWidth = useCallback((columnId: string, width: number) => {
    setState(prev => ({
      ...prev,
      columnWidths: { ...prev.columnWidths, [columnId]: width },
    }));
  }, []);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setState(prev => {
      const newHidden = new Set(prev.hiddenColumns);
      if (newHidden.has(columnId)) {
        newHidden.delete(columnId);
      } else {
        newHidden.add(columnId);
      }
      return { ...prev, hiddenColumns: newHidden };
    });
  }, []);

  const reorderColumn = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newOrder = [...prev.columnOrder];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return { ...prev, columnOrder: newOrder };
    });
  }, []);

  const setEditingCell = useCallback((cell: { rowIndex: number; columnId: string } | null) => {
    setState(prev => ({ ...prev, editingCell: cell }));
  }, []);

  return {
    state: {
      ...state,
      filteredData,
      sortedData,
      displayData,
    },
    visibleColumns,
    totalPages,
    totalRows: sortedData.length,
    actions: {
      setGlobalSearch,
      setSort,
      setFilter,
      clearFilters,
      setPage,
      setPageSize,
      toggleRowSelection,
      selectAll,
      toggleRowExpansion,
      setColumnWidth,
      toggleColumnVisibility,
      reorderColumn,
      setEditingCell,
    },
  };
}
