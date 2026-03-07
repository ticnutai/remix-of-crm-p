// Client Name with Category Tooltip - tenarch CRM Pro
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Users, Heart, Building, Handshake } from 'lucide-react';

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ClientNameWithCategoryProps {
  clientName: string;
  clientId?: string; // Optional - for DataTable link support
  categoryId?: string | null;
  categories: ClientCategory[];
  style?: React.CSSProperties;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-3 w-3" />,
  Heart: <Heart className="h-3 w-3" />,
  Building: <Building className="h-3 w-3" />,
  Handshake: <Handshake className="h-3 w-3" />,
  FolderOpen: <FolderOpen className="h-3 w-3" />,
};

export function ClientNameWithCategory({
  clientName,
  clientId,
  categoryId,
  categories,
  style,
  className,
}: ClientNameWithCategoryProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const category = categoryId ? categories.find(c => c.id === categoryId) : null;

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    updatePosition();
    setShowTooltip(true);
  }, [updatePosition]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Render with Link if clientId provided
  const nameElement = clientId ? (
    <Link 
      to={`/client-profile/${clientId}`}
      className="text-primary hover:underline font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      {clientName}
    </Link>
  ) : (
    <>{clientName}</>
  );

  if (!category) {
    return nameElement;
  }

  return (
    <span
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-block', cursor: 'default' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {nameElement}
      
      {/* Tooltip rendered via Portal to escape overflow:hidden */}
      {showTooltip && tooltipPos && createPortal(
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            right: tooltipPos.right,
            backgroundColor: '#1e293b',
            border: '2px solid #d4a843',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            zIndex: 9999,
            minWidth: '160px',
            whiteSpace: 'nowrap',
            animation: 'clientCatFadeIn 0.2s ease-in',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Category Icon */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: category.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              {iconMap[category.icon] || <FolderOpen className="h-3 w-3" />}
            </div>

            {/* Category Name */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  marginBottom: '2px',
                }}
              >
                קטגוריה:
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#ffffff',
                }}
              >
                {category.name}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '16px',
              width: '0',
              height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid #d4a843',
            }}
          />
        </div>,
        document.body
      )}

      <style>{`
        @keyframes clientCatFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </span>
  );
}
