import { Button } from "@/components/ui/button";
import { List, UsersRound } from "lucide-react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { cn } from "@/lib/utils";

export type ClientGroupEntity = "tasks" | "meetings" | "reminders";

type ClientLike = {
  id: string;
  name: string;
};

type ClientGroupingToggleProps = {
  entity: ClientGroupEntity;
  iconOnly?: boolean;
  className?: string;
};

export function useClientGrouping(entity: ClientGroupEntity) {
  return useSyncedSetting<boolean>({
    key: `${entity}-group-by-client`,
    defaultValue: false,
  });
}

export function ClientGroupingToggle({
  entity,
  iconOnly = false,
  className,
}: ClientGroupingToggleProps) {
  const [grouped, setGrouped] = useClientGrouping(entity);

  return (
    <Button
      type="button"
      variant={grouped ? "default" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      className={cn("gap-2", className)}
      onClick={() => setGrouped(!grouped)}
      title={grouped ? "הצג כרשימה אחת" : "קבץ לפי לקוח"}
      aria-pressed={grouped}
    >
      {grouped ? <UsersRound className="h-4 w-4" /> : <List className="h-4 w-4" />}
      {!iconOnly && <span>{grouped ? "לפי לקוח" : "רשימה רגילה"}</span>}
    </Button>
  );
}

export function getItemClientName(
  item: any,
  clients: ClientLike[] = [],
  fallbackClientName?: string,
) {
  const embeddedName =
    item?.client?.name ||
    item?.client_name ||
    item?.clients?.name;
  if (embeddedName) return embeddedName;

  const directClientId =
    item?.client_id ||
    ((item?.entity_type === "client" || item?.entity_type === "clients")
      ? item?.entity_id
      : null);
  if (directClientId) {
    const match = clients.find((client) => client.id === directClientId);
    if (match?.name) return match.name;
    if (fallbackClientName) return fallbackClientName;
  }

  return "ללא לקוח";
}

export function groupItemsByClient<T>(
  items: T[],
  clients: ClientLike[] = [],
  fallbackClientName?: string,
) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const clientName = getItemClientName(item, clients, fallbackClientName);
    const group = groups.get(clientName) || [];
    group.push(item);
    groups.set(clientName, group);
  }

  return Array.from(groups, ([clientName, groupItems]) => ({
    clientName,
    items: groupItems,
  })).sort((a, b) => {
    if (a.clientName === "ללא לקוח") return 1;
    if (b.clientName === "ללא לקוח") return -1;
    return a.clientName.localeCompare(b.clientName, "he");
  });
}
