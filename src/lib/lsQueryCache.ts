/**
 * localStorage cache helpers for react-query.
 * Use to make widgets render their last-known data instantly on first paint,
 * while the real query refetches in the background.
 */

const PREFIX = 'lsq:';

export function lsRead<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function lsWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    localStorage.setItem(PREFIX + key + ':ts', String(Date.now()));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function lsTimestamp(key: string): number {
  const raw = localStorage.getItem(PREFIX + key + ':ts');
  return raw ? Number(raw) : 0;
}

/** Spread into a useQuery() options object to enable LS cache. */
export function lsCacheOptions<T>(key: string) {
  return {
    initialData: () => lsRead<T>(key),
    initialDataUpdatedAt: () => lsTimestamp(key),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev: T | undefined) => prev,
  } as const;
}
