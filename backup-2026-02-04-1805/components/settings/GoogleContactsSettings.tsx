// Google Contacts Settings Component
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  RefreshCw, 
  Search,
  UserPlus,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Cloud
} from 'lucide-react';
import { useGoogleContacts, GoogleContact } from '@/hooks/useGoogleContacts';
import { ContactsCSVImport } from './ContactsCSVImport';

export function GoogleContactsSettings() {
  const { 
    contacts, 
    isLoading, 
    isImporting,
    fetchContacts, 
    importContactAsClient,
    importMultipleContacts,
    searchContacts 
  } = useGoogleContacts();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [importedContacts, setImportedContacts] = useState<Set<string>>(new Set());

  const handleConnect = async () => {
    await fetchContacts(100);
    setHasLoaded(true);
  };

  const handleRefresh = async () => {
    await fetchContacts(100);
    setSelectedContacts(new Set());
  };

  const filteredContacts = searchQuery 
    ? searchContacts(searchQuery) 
    : contacts;

  const handleSelectContact = (resourceName: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(resourceName)) {
      newSelected.delete(resourceName);
    } else {
      newSelected.add(resourceName);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.resourceName)));
    }
  };

  const handleImportSelected = async () => {
    const contactsToImport = contacts.filter(c => 
      selectedContacts.has(c.resourceName) && !importedContacts.has(c.resourceName)
    );
    
    const count = await importMultipleContacts(contactsToImport);
    
    if (count > 0) {
      const newImported = new Set(importedContacts);
      contactsToImport.forEach(c => newImported.add(c.resourceName));
      setImportedContacts(newImported);
      setSelectedContacts(new Set());
    }
  };

  const handleImportSingle = async (contact: GoogleContact) => {
    const result = await importContactAsClient(contact);
    if (result) {
      const newImported = new Set(importedContacts);
      newImported.add(contact.resourceName);
      setImportedContacts(newImported);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const [activeTab, setActiveTab] = useState<'google' | 'csv'>('google');

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>ייבוא אנשי קשר</CardTitle>
              <CardDescription>ייבוא אנשי קשר מ-Google או מקובץ CSV</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'google' | 'csv')}>
          <TabsList className="grid w-full grid-cols-2 mb-4" dir="rtl">
            <TabsTrigger value="google" className="gap-2">
              <Cloud className="h-4 w-4" />
              Google Contacts
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              קובץ CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv">
            <ContactsCSVImport />
          </TabsContent>

          <TabsContent value="google">
            {/* Google Contacts Actions */}
            <div className="flex gap-2 mb-4">
              {hasLoaded && (
                <>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                    רענון
                  </Button>
                  {selectedContacts.size > 0 && (
                    <Button 
                      onClick={handleImportSelected} 
                      disabled={isImporting}
                    >
                      <UserPlus className="h-4 w-4 ml-2" />
                      {isImporting ? 'מייבא...' : `ייבא ${selectedContacts.size} נבחרים`}
                    </Button>
                  )}
                </>
              )}
              {!hasLoaded && (
                <Button onClick={handleConnect} disabled={isLoading} className="w-full">
                  <Cloud className="h-4 w-4 ml-2" />
                  {isLoading ? 'מתחבר...' : 'התחבר לאנשי קשר Google'}
                </Button>
              )}
            </div>

            {isLoading && !hasLoaded && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {!hasLoaded && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>התחבר לחשבון Google לייבוא אנשי קשר</p>
              </div>
            )}

            {hasLoaded && (
              <>
                {/* Search and select all */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חיפוש אנשי קשר..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9"
                    />
                  </div>
                  <Button variant="outline" onClick={handleSelectAll}>
                    {selectedContacts.size === filteredContacts.length ? 'בטל הכל' : 'בחר הכל'}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground mb-2">
                  נמצאו {filteredContacts.length} אנשי קשר
                  {selectedContacts.size > 0 && ` • נבחרו ${selectedContacts.size}`}
                </div>

                <ScrollArea className="h-[350px]">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>לא נמצאו אנשי קשר</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredContacts.map((contact) => {
                        const isImported = importedContacts.has(contact.resourceName);
                        const isSelected = selectedContacts.has(contact.resourceName);
                        
                        return (
                          <div
                            key={contact.resourceName}
                            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                              isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                            } ${isImported ? 'opacity-60' : ''}`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectContact(contact.resourceName)}
                              disabled={isImported}
                            />
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={contact.photoUrl} alt={contact.name} />
                              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{contact.name}</span>
                                {isImported && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle2 className="h-3 w-3 ml-1" />
                                    יובא
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                                {contact.phone && (
                                  <span className="flex items-center gap-1" dir="ltr">
                                    {contact.phone}
                                    <Phone className="h-3 w-3" />
                                  </span>
                                )}
                                {contact.email && (
                                  <span className="flex items-center gap-1" dir="ltr">
                                    {contact.email}
                                    <Mail className="h-3 w-3" />
                                  </span>
                                )}
                                {contact.company && (
                                  <span className="flex items-center gap-1">
                                    {contact.company}
                                    <Building2 className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isImported && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleImportSingle(contact)}
                                disabled={isImporting}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
