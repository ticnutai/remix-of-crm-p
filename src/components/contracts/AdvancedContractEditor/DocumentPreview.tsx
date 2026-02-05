// DocumentPreview - תצוגה מקדימה של החוזה
import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContractDocument,
  ContractBlock,
  HeaderContent,
  PartiesContent,
  SectionContent,
  PaymentsContent,
  TimelineContent,
  TermsContent,
  SignaturesContent,
  NotesContent,
  CustomContent,
  COLOR_SCHEMES,
  DESIGN_TEMPLATES,
} from './types';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface DocumentPreviewProps {
  document: ContractDocument;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string) => void;
  className?: string;
}

export function DocumentPreview({
  document,
  selectedBlockId,
  onSelectBlock,
  className,
}: DocumentPreviewProps) {
  const colorScheme = COLOR_SCHEMES[document.colorScheme];
  const template = DESIGN_TEMPLATES[document.designTemplate];

  // CSS Variables לערכת הצבעים
  const cssVariables = useMemo(() => ({
    '--contract-primary': colorScheme.primary,
    '--contract-secondary': colorScheme.secondary,
    '--contract-accent': colorScheme.accent,
    '--contract-background': colorScheme.background,
    '--contract-text': colorScheme.text,
  }), [colorScheme]);

  // סגנונות לפי תבנית
  const templateStyles = useMemo(() => {
    switch (document.designTemplate) {
      case 'modern':
        return {
          container: 'rounded-xl shadow-2xl',
          header: 'bg-gradient-to-br from-[var(--contract-primary)] to-[var(--contract-secondary)] text-white',
          section: 'border-r-4 border-[var(--contract-primary)] pr-4',
          card: 'backdrop-blur-sm bg-white/80 rounded-lg shadow-md',
        };
      case 'minimal':
        return {
          container: 'border-2',
          header: 'border-b-2 border-[var(--contract-primary)]',
          section: 'border-b border-gray-200 pb-4',
          card: 'bg-gray-50 rounded-md',
        };
      case 'classic':
      default:
        return {
          container: 'border shadow-lg',
          header: 'bg-[var(--contract-primary)] text-white',
          section: 'border-b border-gray-300 pb-4',
          card: 'bg-white border rounded-md shadow-sm',
        };
    }
  }, [document.designTemplate]);

  const visibleBlocks = document.blocks.filter((b) => b.visible);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div
        className={cn(
          'max-w-4xl mx-auto my-8 bg-white',
          document.settings?.darkMode && 'bg-gray-900 text-white',
          templateStyles.container
        )}
        style={cssVariables as React.CSSProperties}
        dir="rtl"
      >
        {/* Header */}
        {document.settings?.showHeader && (
          <div className={cn('px-8 py-6', templateStyles.header)}>
            <div className="text-center">
              <h1 className="text-2xl font-bold">{document.title}</h1>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8 space-y-6">
          {visibleBlocks.map((block) => (
            <div
              key={block.id}
              className={cn(
                'transition-all cursor-pointer',
                selectedBlockId === block.id && 'ring-2 ring-blue-500 rounded-lg',
                document.designTemplate === 'modern' && 'hover:shadow-lg'
              )}
              onClick={() => onSelectBlock?.(block.id)}
            >
              {renderBlock(block, templateStyles, document.settings?.darkMode)}
            </div>
          ))}
        </div>

        {/* Footer */}
        {document.settings?.showFooter && (
          <div className="px-8 py-4 border-t text-center text-sm text-muted-foreground">
            <p>מסמך זה נוצר באמצעות מערכת NCRM</p>
            {document.settings?.showPageNumbers && <p>עמוד 1 מתוך 1</p>}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// רינדור בלוק לפי סוג
function renderBlock(
  block: ContractBlock,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  switch (block.type) {
    case 'header':
      return renderHeaderBlock(block.content as HeaderContent, styles, darkMode);
    case 'parties':
      return renderPartiesBlock(block.content as PartiesContent, styles, darkMode);
    case 'section':
      return renderSectionBlock(block, styles, darkMode);
    case 'payments':
      return renderPaymentsBlock(block.content as PaymentsContent, styles, darkMode);
    case 'timeline':
      return renderTimelineBlock(block.content as TimelineContent, styles, darkMode);
    case 'terms':
      return renderTermsBlock(block.content as TermsContent, styles, darkMode);
    case 'signatures':
      return renderSignaturesBlock(block.content as SignaturesContent, styles, darkMode);
    case 'notes':
      return renderNotesBlock(block.content as NotesContent, styles, darkMode);
    case 'custom':
      return renderCustomBlock(block.content as CustomContent);
    default:
      return <div className="text-muted-foreground">בלוק לא מוכר</div>;
  }
}

// Header Block
function renderHeaderBlock(
  content: HeaderContent,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  return (
    <div className={cn('text-center space-y-2 py-4', styles.section)}>
      {content.logo && (
        <img
          src={content.logo}
          alt="Logo"
          className="h-16 mx-auto object-contain"
        />
      )}
      <h1 className="text-3xl font-bold">{content.title}</h1>
      {content.subtitle && (
        <p className="text-lg text-muted-foreground">{content.subtitle}</p>
      )}
      <div className="flex justify-center gap-8 text-sm text-muted-foreground mt-4">
        {content.contractNumber && <span>מס׳ חוזה: {content.contractNumber}</span>}
        {content.date && <span>תאריך: {content.date}</span>}
      </div>
    </div>
  );
}

// Parties Block
function renderPartiesBlock(
  content: PartiesContent,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  return (
    <div className={cn('space-y-4', styles.section)}>
      <h2 className="text-xl font-bold border-b pb-2">הצדדים להסכם</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.parties.map((party, index) => (
          <div key={party.id} className={cn('p-4', styles.card)}>
            <h3 className="font-bold mb-2">
              צד {party.type === 'client' ? 'א׳ (המזמין)' : 'ב׳ (הספק)'}
            </h3>
            <div className="space-y-1 text-sm">
              <p><strong>שם:</strong> {party.name || '________'}</p>
              {party.idNumber && <p><strong>ח.פ/ת.ז:</strong> {party.idNumber}</p>}
              {party.address && <p><strong>כתובת:</strong> {party.address}</p>}
              {party.phone && <p><strong>טלפון:</strong> {party.phone}</p>}
              {party.email && <p><strong>דוא״ל:</strong> {party.email}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Section Block
function renderSectionBlock(
  block: ContractBlock,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  const content = block.content as SectionContent;
  return (
    <div className={cn('space-y-3', styles.section)}>
      <h2 className="text-xl font-bold border-b pb-2">{block.title}</h2>
      {content.items.length > 0 ? (
        <ul className="space-y-2">
          {content.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                'flex items-start gap-2',
                !item.included && 'opacity-50 line-through'
              )}
            >
              {content.showCheckmarks !== false && (
                <CheckCircle
                  className={cn(
                    'h-5 w-5 flex-shrink-0 mt-0.5',
                    item.included ? 'text-green-500' : 'text-gray-300'
                  )}
                />
              )}
              <span className="flex-1">{item.text}</span>
              {content.showPrices && item.price !== undefined && (
                <span className="font-medium">₪{item.price.toLocaleString()}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">אין פריטים</p>
      )}
    </div>
  );
}

// Payments Block
function renderPaymentsBlock(
  content: PaymentsContent,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  const currency = content.currency || '₪';
  return (
    <div className={cn('space-y-4', styles.section)}>
      <h2 className="text-xl font-bold border-b pb-2">לוח תשלומים</h2>
      {content.paymentTerms && (
        <p className="text-sm text-muted-foreground">
          תנאי תשלום: {content.paymentTerms}
        </p>
      )}
      {content.steps.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2 px-3">#</th>
                <th className="text-right py-2 px-3">תיאור</th>
                <th className="text-right py-2 px-3">אחוז</th>
                <th className="text-right py-2 px-3">סכום</th>
                <th className="text-right py-2 px-3">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {content.steps.map((step, index) => (
                <tr key={step.id} className="border-b">
                  <td className="py-2 px-3">{index + 1}</td>
                  <td className="py-2 px-3">{step.title}</td>
                  <td className="py-2 px-3">{step.percentage}%</td>
                  <td className="py-2 px-3">
                    {step.amount ? `${currency}${step.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-2 px-3">{step.dueDate || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">לא הוגדרו שלבי תשלום</p>
      )}
    </div>
  );
}

// Timeline Block
function renderTimelineBlock(
  content: TimelineContent,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  return (
    <div className={cn('space-y-4', styles.section)}>
      <h2 className="text-xl font-bold border-b pb-2">לוח זמנים</h2>
      {content.steps.length > 0 ? (
        <div className="relative">
          {content.steps.map((step, index) => (
            <div key={step.id} className="flex gap-4 pb-6 relative">
              {/* Timeline Line */}
              {index < content.steps.length - 1 && (
                <div className="absolute right-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
              )}
              {/* Dot */}
              <div className="w-6 h-6 rounded-full bg-[var(--contract-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {index + 1}
              </div>
              {/* Content */}
              <div className="flex-1">
                <h3 className="font-bold">{step.title}</h3>
                <div className="text-sm text-muted-foreground">
                  {step.duration && <span>משך: {step.duration}</span>}
                  {step.startDate && step.endDate && (
                    <span className="mr-4">
                      {step.startDate} - {step.endDate}
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm mt-1">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">לא הוגדרו שלבים</p>
      )}
    </div>
  );
}

// Terms Block
function renderTermsBlock(
  content: TermsContent,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  return (
    <div className={cn('space-y-4', styles.section)}>
      <h2 className="text-xl font-bold border-b pb-2">תנאים והתניות</h2>
      {content.terms.length > 0 && (
        <ol className="list-decimal list-inside space-y-2 text-sm">
          {content.terms.map((term) => (
            <li key={term.id}>{term.text}</li>
          ))}
        </ol>
      )}
      {content.specialClauses && content.specialClauses.length > 0 && (
        <div className="space-y-3 mt-4">
          {content.specialClauses.map((clause) => (
            <div key={clause.id} className={cn('p-3', styles.card)}>
              <h3 className="font-bold text-sm mb-1">{clause.title}</h3>
              <p className="text-sm">{clause.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Signatures Block
function renderSignaturesBlock(
  content: SignaturesContent,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  return (
    <div className={cn('space-y-6 pt-8', styles.section)}>
      <h2 className="text-xl font-bold border-b pb-2">חתימות</h2>
      <div className="grid grid-cols-2 gap-8">
        {content.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="border-b-2 border-black h-16"></div>
            <p className="text-center font-medium">{field.label}</p>
            {field.title && (
              <p className="text-center text-sm text-muted-foreground">
                {field.title}
              </p>
            )}
            {content.showDate && (
              <p className="text-center text-sm text-muted-foreground">
                תאריך: ________________
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Notes Block
function renderNotesBlock(
  content: NotesContent,
  styles: Record<string, string>,
  darkMode?: boolean
) {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'important':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type?: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'important':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={cn('space-y-3', styles.section)}>
      <h2 className="text-xl font-bold border-b pb-2">הערות חשובות</h2>
      {content.notes.map((note) => (
        <div
          key={note.id}
          className={cn('flex items-start gap-3 p-3 rounded-md border', getBgColor(note.type))}
        >
          {getIcon(note.type)}
          <p className="text-sm">{note.text}</p>
        </div>
      ))}
    </div>
  );
}

// Custom Block
function renderCustomBlock(content: CustomContent) {
  return (
    <div
      className="custom-content"
      dangerouslySetInnerHTML={{ __html: content.html }}
    />
  );
}

export default DocumentPreview;
