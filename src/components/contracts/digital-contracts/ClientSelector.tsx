import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Phone, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
}

interface ClientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}

export const ClientSelector = ({ isOpen, onClose, onSelectClient }: ClientSelectorProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.phone?.toLowerCase().includes(query) ||
            client.company?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone, company, address")
        .order("name");

      if (error) throw error;
      
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("שגיאה בטעינת לקוחות");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    onClose();
    toast.success(`נבחר לקוח: ${client.name}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gold" />
            בחר לקוח מהמערכת
          </DialogTitle>
          <DialogDescription>
            בחר לקוח כדי למלא אוטומטית את פרטי החוזה
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="חפש לפי שם, אימייל, טלפון או חברה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
          />
        </div>

        {/* Clients List */}
        <div className="overflow-y-auto max-h-[50vh] space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">טוען לקוחות...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "לא נמצאו לקוחות התואמים את החיפוש" : "אין לקוחות במערכת"}
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className="p-4 border rounded-lg hover:bg-accent hover:border-gold cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-right group-hover:text-gold transition-colors">
                      {client.name}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {client.company && (
                        <div className="flex items-center gap-2 justify-end">
                          <span>{client.company}</span>
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 justify-end">
                          <span dir="ltr">{client.email}</span>
                          <Mail className="w-4 h-4" />
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 justify-end">
                          <span dir="ltr">{client.phone}</span>
                          <Phone className="w-4 h-4" />
                        </div>
                      )}
                      {client.address && (
                        <div className="text-xs text-right">
                          {client.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
