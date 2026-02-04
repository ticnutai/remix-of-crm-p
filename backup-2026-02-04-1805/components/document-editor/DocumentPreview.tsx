import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { DocumentData } from './types';

interface DocumentPreviewProps {
  document: DocumentData;
  scale?: number;
  fitToContainer?: boolean;
  editable?: boolean;
  onFieldClick?: (field: string) => void;
}

const formatCurrency = (amount: number, currency: string = 'ILS') => {
  const currencyMap: Record<string, string> = {
    ILS: '₪',
    USD: '$',
    EUR: '€',
  };
  const symbol = currencyMap[currency] || '₪';
  return `${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: he });
  } catch {
    return dateStr;
  }
};

const getFontSizeClass = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return 'text-xs';
    case 'large':
      return 'text-base';
    default:
      return 'text-sm';
  }
};

export function DocumentPreview({
  document: doc,
  scale = 1,
  fitToContainer = false,
  editable = false,
  onFieldClick,
}: DocumentPreviewProps) {
  const { settings } = doc;
  const fontSizeClass = getFontSizeClass(settings.fontSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);

  // A4 dimensions in pixels at 96dpi
  const A4_WIDTH = 210 * 3.78;
  const A4_HEIGHT = 297 * 3.78;

  // Calculate auto scale to fit container
  useEffect(() => {
    if (!fitToContainer || !containerRef.current) return;

    const calculateScale = () => {
      const container = containerRef.current?.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth - 32; // padding
      const containerHeight = container.clientHeight - 32;

      // Calculate scale to fit width and height
      const scaleX = containerWidth / A4_WIDTH;
      const scaleY = containerHeight / A4_HEIGHT;

      // Use the smaller scale to ensure the document fits
      const newScale = Math.min(scaleX, scaleY, 1) * 0.95; // 95% to leave some margin
      setAutoScale(Math.max(newScale, 0.3)); // Minimum 30% scale
    };

    calculateScale();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, [fitToContainer]);

  const effectiveScale = fitToContainer ? autoScale * (scale / 100 || 1) : scale;

  // Find primary client/company parties
  const companyParty = doc.parties.find(p => p.type === 'company');
  const clientParty = doc.parties.find(p => p.type === 'client');

  // Calculate totals
  const subtotal = doc.items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = doc.discountType === 'percent' 
    ? (subtotal * doc.discount) / 100 
    : doc.discount;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = settings.showVat ? (afterDiscount * doc.vatRate) / 100 : 0;
  const total = afterDiscount + vatAmount;

  const EditableField = ({
    field,
    children,
    className,
  }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => {
    if (!editable) return <span className={className}>{children}</span>;
    return (
      <span
        className={cn(
          className,
          'cursor-pointer hover:bg-yellow-100/50 hover:outline hover:outline-2 hover:outline-yellow-400 rounded px-0.5 transition-all'
        )}
        onClick={() => onFieldClick?.(field)}
      >
        {children}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className="bg-white shadow-2xl mx-auto print:shadow-none transition-transform duration-200"
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        transform: `scale(${effectiveScale})`,
        transformOrigin: 'top center',
        fontFamily: settings.fontFamily || 'Heebo',
        direction: 'rtl',
      }}
    >
      {/* Watermark */}
      {settings.showWatermark && doc.status === 'draft' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-8xl font-bold text-red-200/40 rotate-[-30deg]">
            טיוטה
          </span>
        </div>
      )}

      {/* Header */}
      <div
        className="p-8 pb-6"
        style={{ backgroundColor: settings.primaryColor, color: 'white' }}
      >
        <div className={cn(
          "flex items-start",
          doc.branding?.logoPosition === 'center' ? 'flex-col items-center text-center' : 'justify-between'
        )}>
          {/* Company Info with Branding */}
          <div className={cn(
            "space-y-1",
            doc.branding?.logoPosition === 'left' && 'order-2',
            doc.branding?.logoPosition === 'center' && 'order-1'
          )}>
            {/* Logo */}
            {settings.showLogo && doc.branding?.logo ? (
              <div className={cn(
                "mb-3",
                doc.branding?.logoPosition === 'center' && 'flex justify-center'
              )}>
                <img
                  src={doc.branding.logo}
                  alt="Logo"
                  className={cn(
                    "object-contain",
                    doc.branding?.logoSize === 'small' && 'h-10 max-w-[100px]',
                    doc.branding?.logoSize === 'medium' && 'h-14 max-w-[150px]',
                    doc.branding?.logoSize === 'large' && 'h-20 max-w-[200px]'
                  )}
                />
              </div>
            ) : settings.showLogo && (doc.branding?.name || companyParty?.company) && (
              <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">
                  {(doc.branding?.name || companyParty?.company || '?')[0]}
                </span>
              </div>
            )}
            
            {/* Company Name */}
            <EditableField field="companyName" className="text-2xl font-bold block">
              {doc.branding?.name || companyParty?.company || companyParty?.name || 'שם החברה'}
            </EditableField>
            
            {/* Tagline */}
            {doc.branding?.tagline && (
              <div className="text-sm opacity-80 italic">{doc.branding.tagline}</div>
            )}
            
            {/* Company Details */}
            {settings.showCompanyDetails && (
              <div className={cn('opacity-90 space-y-0.5 mt-2', fontSizeClass)}>
                {(doc.branding?.address || companyParty?.address) && (
                  <div>{doc.branding?.address || companyParty?.address}</div>
                )}
                <div className="flex gap-4 flex-wrap">
                  {(doc.branding?.phone || companyParty?.phone) && (
                    <span>{doc.branding?.phone || companyParty?.phone}</span>
                  )}
                  {(doc.branding?.email || companyParty?.email) && (
                    <span>{doc.branding?.email || companyParty?.email}</span>
                  )}
                </div>
                {doc.branding?.website && (
                  <div className="opacity-80">{doc.branding.website}</div>
                )}
                {(doc.branding?.registrationNumber || doc.branding?.taxId) && (
                  <div className="opacity-70 text-xs mt-1">
                    {doc.branding?.registrationNumber && <span>ח.פ: {doc.branding.registrationNumber}</span>}
                    {doc.branding?.registrationNumber && doc.branding?.taxId && <span> | </span>}
                    {doc.branding?.taxId && <span>עוסק מורשה: {doc.branding.taxId}</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Info */}
          <div className={cn(
            "text-left space-y-1",
            doc.branding?.logoPosition === 'left' && 'order-1 text-right',
            doc.branding?.logoPosition === 'center' && 'order-2 mt-4 text-center'
          )}>
            {/* Document Title & Type */}
            {doc.title ? (
              <div className="text-xl font-bold">{doc.title}</div>
            ) : (
              <div className="text-xl font-bold" style={{ color: settings.secondaryColor }}>
                {doc.type === 'quote' ? 'הצעת מחיר' : 'חוזה התקשרות'}
              </div>
            )}
            
            {/* Subtitle */}
            {doc.subtitle && (
              <div className="opacity-90 text-sm">{doc.subtitle}</div>
            )}
            
            {/* Location */}
            {doc.location && (
              <div className="opacity-80 text-sm flex items-center gap-1">
                <span>📍</span>
                <span>{doc.location}</span>
              </div>
            )}
            
            {/* Document Details */}
            <div className={cn('opacity-90 mt-2', fontSizeClass)}>
              <div>מספר: {doc.number || 'טרם הוקצה'}</div>
              <div>תאריך: {formatDate(doc.date)}</div>
              {doc.type === 'quote' && doc.validUntil && (
                <div>בתוקף עד: {formatDate(doc.validUntil)}</div>
              )}
              {doc.type === 'contract' && (
                <>
                  {doc.startDate && <div>מתאריך: {formatDate(doc.startDate)}</div>}
                  {doc.endDate && <div>עד תאריך: {formatDate(doc.endDate)}</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Total Price Badge - for advanced quotes */}
        {doc.pricingTiers && doc.pricingTiers.length > 0 && (
          <div className="px-8 pb-4 -mt-2">
            <div 
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <span className="text-4xl font-extrabold">
                ₪{(doc.pricingTiers.find(t => t.isRecommended)?.price || doc.total || 0).toLocaleString()}
              </span>
              <span className="opacity-80 text-sm">+ מע"מ</span>
            </div>
          </div>
        )}
      </div>

      {/* Client Info */}
      {settings.showClientDetails && clientParty && (
        <div className="px-8 py-4 border-b">
          <div className="text-xs text-muted-foreground mb-1">לכבוד:</div>
          <div className="font-semibold">{clientParty.name}</div>
          {clientParty.company && (
            <div className={cn('text-muted-foreground', fontSizeClass)}>{clientParty.company}</div>
          )}
          {clientParty.address && (
            <div className={cn('text-muted-foreground', fontSizeClass)}>{clientParty.address}</div>
          )}
          <div className={cn('text-muted-foreground flex gap-4 mt-1', fontSizeClass)}>
            {clientParty.phone && <span>טל: {clientParty.phone}</span>}
            {clientParty.email && <span>{clientParty.email}</span>}
          </div>
        </div>
      )}

      {/* Introduction */}
      {doc.introduction && (
        <div className={cn('px-8 py-4 border-b', fontSizeClass)}>
          <p className="whitespace-pre-wrap">{doc.introduction}</p>
        </div>
      )}

      {/* ========== PRICING TIERS (חבילות מחיר) ========== */}
      {doc.pricingTiers && doc.pricingTiers.length > 0 && (
        <div className="px-8 py-4">
          <div 
            className="flex items-center gap-2 mb-4 p-3 rounded-lg"
            style={{ 
              backgroundColor: `${settings.primaryColor}10`,
              borderRight: `4px solid ${settings.secondaryColor}`
            }}
          >
            <span>📦</span>
            <span className="font-semibold">חבילות מחיר</span>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(doc.pricingTiers.length, 3)}, 1fr)` }}>
            {doc.pricingTiers.map((tier) => (
              <div 
                key={tier.id}
                className={cn(
                  "rounded-xl p-5 border-2 text-center relative",
                  tier.isRecommended 
                    ? "border-amber-500 bg-amber-50/50" 
                    : "border-gray-200 bg-gray-50"
                )}
              >
                {tier.isRecommended && (
                  <div 
                    className="absolute -top-3 right-4 px-3 py-1 rounded-full text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                  >
                    ★ מומלץ
                  </div>
                )}
                <h3 className="font-bold text-lg mb-2">{tier.name}</h3>
                <div 
                  className="text-2xl font-extrabold mb-2"
                  style={{ color: settings.secondaryColor }}
                >
                  ₪{tier.price.toLocaleString()}
                </div>
                {tier.description && (
                  <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                )}
                <ul className="text-right text-sm space-y-1">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 border-b border-dashed border-gray-200 py-1">
                      <span style={{ color: settings.secondaryColor }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== UPGRADES (שידרוגים ותוספות) ========== */}
      {doc.upgrades && doc.upgrades.length > 0 && (
        <div className="px-8 py-4">
          <div 
            className="flex items-center gap-2 mb-4 p-3 rounded-lg"
            style={{ 
              backgroundColor: `${settings.primaryColor}10`,
              borderRight: `4px solid ${settings.secondaryColor}`
            }}
          >
            <span>✨</span>
            <span className="font-semibold">שידרוגים ותוספות</span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(doc.upgrades.length, 3)}, 1fr)` }}>
            {doc.upgrades.map((upgrade) => (
              <div 
                key={upgrade.id}
                className="rounded-lg p-4 bg-gray-50"
                style={{ borderRight: `4px solid ${settings.secondaryColor}` }}
              >
                <h4 className="font-semibold mb-1">{upgrade.name}</h4>
                <div 
                  className="font-bold text-lg mb-1"
                  style={{ color: settings.secondaryColor }}
                >
                  ₪{upgrade.price.toLocaleString()}
                </div>
                {upgrade.description && (
                  <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== SECTIONS (סעיפים ופריטים) ========== */}
      {doc.sections && doc.sections.length > 0 && (
        <div className="px-8 py-4 space-y-4">
          {doc.sections.map((section) => (
            <div key={section.id}>
              <div 
                className="flex items-center gap-2 mb-3 p-3 rounded-lg"
                style={{ 
                  backgroundColor: `${settings.primaryColor}10`,
                  borderRight: `4px solid ${settings.secondaryColor}`
                }}
              >
                <span>{section.icon || '📋'}</span>
                <span className="font-semibold">{section.title}</span>
              </div>
              <div className="mr-5 space-y-2">
                {section.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start gap-3 py-2 border-b border-gray-100"
                  >
                    <span style={{ color: settings.secondaryColor }} className="mt-1">✓</span>
                    <span className="flex-1">{item.description}</span>
                    {item.upgradePrice && item.upgradePrice > 0 && (
                      <span 
                        className="text-sm font-semibold px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${settings.secondaryColor}20`,
                          color: settings.secondaryColor 
                        }}
                      >
                        +₪{item.upgradePrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items Table - Legacy */}
      {(!doc.sections || doc.sections.length === 0) && doc.items.length > 0 && (
        <div className="px-8 py-4">
          <table className="w-full border-collapse">
          <thead>
            <tr
              className="text-white"
              style={{ backgroundColor: settings.primaryColor }}
            >
              {settings.showItemNumbers && (
                <th className="p-2 text-center w-12 border border-white/20">#</th>
              )}
              <th className="p-2 text-right border border-white/20">תיאור</th>
              <th className="p-2 text-center w-20 border border-white/20">כמות</th>
              <th className="p-2 text-center w-20 border border-white/20">יחידה</th>
              <th className="p-2 text-center w-24 border border-white/20">מחיר יח'</th>
              <th className="p-2 text-center w-28 border border-white/20">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.length === 0 ? (
              <tr>
                <td colSpan={settings.showItemNumbers ? 6 : 5} className="p-8 text-center text-muted-foreground border">
                  אין פריטים. הוסף פריטים מהסרגל הימני או מטופס העריכה.
                </td>
              </tr>
            ) : (
              doc.items.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-muted/20">
                  {settings.showItemNumbers && (
                    <td className="p-2 text-center border text-muted-foreground">{index + 1}</td>
                  )}
                  <td className="p-2 border">
                    <div className="font-medium">{item.description}</div>
                    {item.details && (
                      <div className={cn('text-muted-foreground mt-0.5', fontSizeClass)}>
                        {item.details}
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-center border">{item.quantity}</td>
                  <td className="p-2 text-center border">{item.unit}</td>
                  <td className="p-2 text-center border">{formatCurrency(item.unitPrice, doc.currency)}</td>
                  <td className="p-2 text-center border font-medium">{formatCurrency(item.total, doc.currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        {doc.items.length > 0 && (
          <div className="flex justify-start mt-4">
            <div className="w-64 space-y-1">
              <div className="flex justify-between py-1 border-b">
                <span>סכום ביניים:</span>
                <span>{formatCurrency(subtotal, doc.currency)}</span>
              </div>
              {doc.discount > 0 && (
                <div className="flex justify-between py-1 border-b text-green-600">
                  <span>הנחה{doc.discountType === 'percent' ? ` (${doc.discount}%)` : ''}:</span>
                  <span>-{formatCurrency(discountAmount, doc.currency)}</span>
                </div>
              )}
              {settings.showVat && (
                <div className="flex justify-between py-1 border-b">
                  <span>מע"מ ({doc.vatRate}%):</span>
                  <span>{formatCurrency(vatAmount, doc.currency)}</span>
                </div>
              )}
              <div
                className="flex justify-between py-2 font-bold text-lg"
                style={{ color: settings.primaryColor }}
              >
                <span>סה"כ לתשלום:</span>
                <span>{formatCurrency(total, doc.currency)}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Payment Steps - Card Style */}
      {settings.showPaymentTerms && doc.paymentSteps.length > 0 && (
        <div className="px-8 py-4 border-t">
          <div 
            className="flex items-center gap-2 mb-4 p-3 rounded-lg"
            style={{ 
              backgroundColor: `${settings.primaryColor}10`,
              borderRight: `4px solid ${settings.secondaryColor}`
            }}
          >
            <span>💳</span>
            <span className="font-semibold">לוח תשלומים</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {doc.paymentSteps.map((step) => (
              <div 
                key={step.id}
                className="flex-1 min-w-[140px] rounded-xl p-5 text-center bg-gray-50 border"
              >
                <div 
                  className="text-3xl font-extrabold mb-2"
                  style={{ color: settings.secondaryColor }}
                >
                  {step.percentage}%
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== TIMELINE (לוח זמנים) ========== */}
      {doc.timeline && doc.timeline.length > 0 && (
        <div className="px-8 py-4 border-t">
          <div 
            className="flex items-center gap-2 mb-4 p-3 rounded-lg"
            style={{ 
              backgroundColor: `${settings.primaryColor}10`,
              borderRight: `4px solid ${settings.secondaryColor}`
            }}
          >
            <span>📅</span>
            <span className="font-semibold">לוח זמנים</span>
          </div>
          <div className="space-y-3">
            {doc.timeline.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 border-b border-gray-100 pb-3">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` 
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <span>{step.description}</span>
                  {step.duration && (
                    <span className="text-sm text-muted-foreground mr-2">({step.duration})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== IMPORTANT NOTES (הערות חשובות) ========== */}
      {doc.importantNotes && doc.importantNotes.length > 0 && (
        <div className="px-8 py-4 border-t">
          <div 
            className="flex items-center gap-2 mb-4 p-3 rounded-lg"
            style={{ 
              backgroundColor: `${settings.primaryColor}10`,
              borderRight: `4px solid ${settings.secondaryColor}`
            }}
          >
            <span>⚠️</span>
            <span className="font-semibold">הערות חשובות</span>
          </div>
          <div className="space-y-2">
            {doc.importantNotes.map((note, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ 
                  background: `linear-gradient(to left, ${settings.secondaryColor}15, ${settings.secondaryColor}08)`,
                  borderRight: `4px solid ${settings.secondaryColor}`
                }}
              >
                <span style={{ color: settings.secondaryColor }}>•</span>
                <span className="text-sm">{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms */}
      {doc.terms && (
        <div className="px-8 py-4 border-t">
          <h4 className="font-semibold mb-2">תנאים:</h4>
          <p className={cn('whitespace-pre-wrap text-muted-foreground', fontSizeClass)}>
            {doc.terms}
          </p>
        </div>
      )}

      {/* Special Clauses (Contract only) */}
      {doc.type === 'contract' && doc.specialClauses && (
        <div className="px-8 py-4 border-t">
          <h4 className="font-semibold mb-2">סעיפים מיוחדים:</h4>
          <p className={cn('whitespace-pre-wrap text-muted-foreground', fontSizeClass)}>
            {doc.specialClauses}
          </p>
        </div>
      )}

      {/* Notes */}
      {doc.notes && (
        <div className="px-8 py-4 border-t">
          <h4 className="font-semibold mb-2">הערות:</h4>
          <p className={cn('whitespace-pre-wrap text-muted-foreground', fontSizeClass)}>
            {doc.notes}
          </p>
        </div>
      )}

      {/* Signatures */}
      {settings.showSignatures && (
        <div className="px-8 py-6 border-t mt-auto">
          <div className="flex justify-between gap-8">
            {/* Company signature */}
            <div className="flex-1">
              <div className="border-t-2 border-gray-400 pt-2 mt-8">
                <div className="text-center text-sm">
                  {companyParty?.name || 'החברה'}
                </div>
                <div className="text-center text-xs text-muted-foreground">חתימה</div>
              </div>
            </div>
            {/* Client signature */}
            <div className="flex-1">
              <div className="border-t-2 border-gray-400 pt-2 mt-8">
                <div className="text-center text-sm">
                  {clientParty?.name || 'הלקוח'}
                </div>
                <div className="text-center text-xs text-muted-foreground">חתימה</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {doc.footer && (
        <div
          className="px-8 py-4 text-center text-xs text-white mt-auto"
          style={{ backgroundColor: settings.primaryColor }}
        >
          {doc.footer}
        </div>
      )}
    </div>
  );
}
