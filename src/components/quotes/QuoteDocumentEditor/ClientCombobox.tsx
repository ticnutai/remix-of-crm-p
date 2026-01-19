import React, { useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useClients, Client } from '@/hooks/useClients';

interface ClientComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onClientSelect: (client: Client) => void;
}

export function ClientCombobox({ value, onChange, onClientSelect }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { clients, loading } = useClients();

  const filteredClients = clients.filter((client) => {
    const search = searchValue.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      (client.company?.toLowerCase().includes(search) ?? false)
    );
  });

  const selectedClient = clients.find((c) => c.name === value);

  const handleSelect = (client: Client) => {
    onChange(client.name);
    onClientSelect(client);
    setOpen(false);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {value || 'בחר לקוח...'}
          </span>
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="חפש לקוח..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="text-right"
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                טוען לקוחות...
              </div>
            ) : filteredClients.length === 0 ? (
              <CommandEmpty>
                <div className="py-2 text-center text-sm text-muted-foreground">
                  לא נמצאו לקוחות
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup heading="לקוחות">
                {filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === client.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 text-right">
                      <span className="font-medium">{client.name}</span>
                      {client.company && (
                        <span className="text-xs text-muted-foreground">
                          {client.company}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
