export type RecentClientOrderItem = {
  id: string;
};

export function sortByPersonalRecentOrder<T extends RecentClientOrderItem>(
  clients: T[],
  personalOrder: string[],
  latestActivityByClient: Record<string, string>,
): T[] {
  const rank = new Map(personalOrder.map((clientId, index) => [clientId, index]));

  return [...clients].sort((a, b) => {
    const rankA = rank.get(a.id);
    const rankB = rank.get(b.id);

    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;

    return (
      new Date(latestActivityByClient[b.id] || 0).getTime() -
      new Date(latestActivityByClient[a.id] || 0).getTime()
    );
  });
}

export function moveRecentClientBefore(
  personalOrder: string[],
  visibleClientIds: string[],
  draggedClientId: string,
  targetClientId: string,
): string[] {
  if (
    draggedClientId === targetClientId ||
    !visibleClientIds.includes(draggedClientId) ||
    !visibleClientIds.includes(targetClientId)
  ) {
    return personalOrder;
  }

  const reorderedVisible = visibleClientIds.filter(
    (clientId) => clientId !== draggedClientId,
  );
  const targetIndex = reorderedVisible.indexOf(targetClientId);
  reorderedVisible.splice(targetIndex, 0, draggedClientId);

  const visibleIds = new Set(visibleClientIds);
  const savedButNotVisible = personalOrder.filter(
    (clientId) => !visibleIds.has(clientId),
  );

  return [...reorderedVisible, ...savedButNotVisible];
}
