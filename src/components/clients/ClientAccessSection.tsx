// Client Access Management Section - for Clients page
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreateClientLoginDialog } from "./CreateClientLoginDialog";
import {
  KeyRound, Search, Shield, ShieldOff, UserCheck, UserX, Loader2, ExternalLink, MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientAccess {
  id: string;
  name: string;
  email: string | null;
  user_id: string | null;
  status: string | null;
}

export function ClientAccessSection() {
  const [clients, setClients] = useState<ClientAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with" | "without">("all");
  const [selectedClient, setSelectedClient] = useState<ClientAccess | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const { toast } = useToast();

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, email, user_id, status")
      .order("name");

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "with" && c.user_id) ||
      (filter === "without" && !c.user_id);
    return matchesSearch && matchesFilter;
  });

  const withAccess = clients.filter((c) => c.user_id).length;
  const withoutAccess = clients.filter((c) => !c.user_id).length;

  const handleRevoke = async () => {
    if (!selectedClient?.user_id) return;
    setRevoking(true);
    try {
      // Remove user_id from client
      await supabase
        .from("clients")
        .update({ user_id: null })
        .eq("id", selectedClient.id);

      toast({ title: "הגישה בוטלה", description: `גישת הפורטל של ${selectedClient.name} בוטלה` });
      fetchClients();
    } catch {
      toast({ title: "שגיאה בביטול הגישה", variant: "destructive" });
    } finally {
      setRevoking(false);
      setShowRevokeDialog(false);
      setSelectedClient(null);
    }
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              ניהול גישות לקוחות לפורטל
            </CardTitle>
            <CardDescription className="mt-1">
              צפה וניהול חשבונות כניסה של לקוחות לפורטל
            </CardDescription>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="default">{withAccess} עם גישה</Badge>
            <Badge variant="outline">{withoutAccess} ללא גישה</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לקוח..."
              className="pr-9"
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              הכל
            </Button>
            <Button
              size="sm"
              variant={filter === "with" ? "default" : "outline"}
              onClick={() => setFilter("with")}
            >
              <UserCheck className="h-3.5 w-3.5 ml-1" />
              עם גישה
            </Button>
            <Button
              size="sm"
              variant={filter === "without" ? "default" : "outline"}
              onClick={() => setFilter("without")}
            >
              <UserX className="h-3.5 w-3.5 ml-1" />
              ללא גישה
            </Button>
          </div>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredClients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">לא נמצאו לקוחות</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      client.user_id
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {client.user_id ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.email || "ללא אימייל"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {client.user_id ? (
                    <>
                      <Badge variant="default" className="text-xs">
                        <Shield className="h-3 w-3 ml-1" />
                        גישה פעילה
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClient(client);
                              setShowRevokeDialog(true);
                            }}
                            className="text-destructive"
                          >
                            <ShieldOff className="h-4 w-4 ml-2" />
                            ביטול גישה
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedClient(client);
                        setShowCreateDialog(true);
                      }}
                    >
                      <KeyRound className="h-3.5 w-3.5 ml-1" />
                      צור גישה
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Login Dialog */}
      {selectedClient && (
        <CreateClientLoginDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientEmail={selectedClient.email || ""}
          onSuccess={fetchClients}
        />
      )}

      {/* Revoke Access Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>ביטול גישה לפורטל</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לבטל את גישת הפורטל של {selectedClient?.name}?
              הלקוח לא יוכל יותר להיכנס לפורטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
              בטל גישה
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
