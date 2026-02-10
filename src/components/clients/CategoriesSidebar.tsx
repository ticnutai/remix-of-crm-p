// Categories Sidebar Component - tenarch CRM Pro
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FolderOpen, 
  Users, 
  Heart, 
  Building, 
  Handshake,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface CategoriesSidebarProps {
  categories: ClientCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearCategories: () => void;
  clientCounts?: Record<string, number>;
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Handshake: <Handshake className="h-4 w-4" />,
  FolderOpen: <FolderOpen className="h-4 w-4" />,
};

export function CategoriesSidebar({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  clientCounts = {},
}: CategoriesSidebarProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      dir="rtl"
      style={{
        width: '240px',
        backgroundColor: '#ffffff',
        border: '2px solid #d4a843',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginLeft: '16px',
        height: 'fit-content',
        maxHeight: '600px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '2px solid #d4a843',
          backgroundColor: '#fef9ee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOpen style={{ width: '18px', height: '18px', color: '#d4a843' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            קטגוריות
          </h3>
        </div>
        {selectedCategories.length > 0 && (
          <button
            onClick={onClearCategories}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: '1px solid #d4a843',
              borderRadius: '6px',
              color: '#d4a843',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d4a843';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d4a843';
            }}
            title="נקה בחירות"
          >
            <X style={{ width: '12px', height: '12px' }} />
            נקה
          </button>
        )}
      </div>

      {/* Categories List */}
      <ScrollArea className="flex-1">
        <div style={{ padding: '8px' }}>
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            const count = clientCounts[category.id] || 0;

            return (
              <button
                key={category.id}
                onClick={() => onToggleCategory(category.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  marginBottom: '6px',
                  backgroundColor: isSelected ? '#d4a843' : '#ffffff',
                  border: isSelected ? '2px solid #d4a843' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'right',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#fef9ee';
                    e.currentTarget.style.borderColor = '#d4a843';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                {/* Category Icon */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#ffffff' : category.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isSelected ? category.color : '#ffffff',
                  }}
                >
                  {iconMap[category.icon] || <FolderOpen className="h-4 w-4" />}
                </div>

                {/* Category Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isSelected ? '#1e293b' : '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {category.name}
                  </div>
                  {count > 0 && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: isSelected ? '#64748b' : '#94a3b8',
                        marginTop: '2px',
                      }}
                    >
                      {count} לקוחות
                    </div>
                  )}
                </div>

                {/* Selected Badge */}
                {isSelected && (
                  <Badge
                    style={{
                      backgroundColor: '#1e3a5f',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '2px 6px',
                    }}
                  >
                    ✓
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer - Selected Count */}
      {selectedCategories.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            fontSize: '13px',
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          {selectedCategories.length === 1
            ? 'קטגוריה 1 נבחרה'
            : `${selectedCategories.length} קטגוריות נבחרו`}
        </div>
      )}
    </div>
  );
}
