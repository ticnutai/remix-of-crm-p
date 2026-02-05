// רינדור תצוגה מקדימה מתקדמת לבלוקים
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContractBlock, ColorScheme } from './types';

interface BlockPreviewProps {
  block: ContractBlock;
  colorScheme: ColorScheme;
  isSelected?: boolean;
}

export function BlockPreview({ block, colorScheme, isSelected }: BlockPreviewProps) {
  if (!block.visible) return null;

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'gold':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'blue':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'green':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'purple':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
      default:
        return 'border-slate-300 bg-slate-50 dark:bg-slate-800';
    }
  };

  const renderContent = () => {
    const content = block.content || {};

    switch (block.type) {
      case 'header':
        return (
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">{content.title || 'כותרת המסמך'}</h1>
            {content.subtitle && (
              <p className="text-xl text-muted-foreground">{content.subtitle}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              {content.documentNumber && <span>מסמך: {content.documentNumber}</span>}
              {content.date && <span>תאריך: {new Date(content.date).toLocaleDateString('he-IL')}</span>}
            </div>
          </div>
        );

      case 'parties':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">צדדים להסכם</h2>
            {content.parties?.map((party: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{party.name || `צד ${index + 1}`}</h3>
                  <Badge>{party.role === 'client' ? 'לקוח' : party.role === 'contractor' ? 'קבלן' : party.role}</Badge>
                </div>
                {party.idNumber && <p className="text-sm">ת.ז/ח.פ: {party.idNumber}</p>}
                {party.address && <p className="text-sm">כתובת: {party.address}</p>}
                {party.phone && <p className="text-sm">טלפון: {party.phone}</p>}
                {party.email && <p className="text-sm">דוא"ל: {party.email}</p>}
              </div>
            ))}
          </div>
        );

      case 'section':
        return (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              {content.sectionNumber && (
                <span className="font-bold text-lg">{content.sectionNumber}.</span>
              )}
              <h2 className="text-xl font-bold">{content.title || 'כותרת הסעיף'}</h2>
            </div>
            {content.content && (
              <p className="text-base leading-relaxed whitespace-pre-wrap">{content.content}</p>
            )}
          </div>
        );

      case 'items':
        const subtotal = content.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
        const vat = content.showVat ? subtotal * ((content.vatRate || 17) / 100) : 0;
        const total = subtotal + vat;
        const currencySymbol = content.currency === 'ILS' ? '₪' : content.currency === 'USD' ? '$' : '€';

        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">פירוט פריטים</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-right p-2">תיאור</th>
                  <th className="text-center p-2">כמות</th>
                  <th className="text-center p-2">יחידה</th>
                  <th className="text-left p-2">מחיר</th>
                  <th className="text-left p-2">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {content.items?.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.description}</td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-center p-2">{item.unit}</td>
                    <td className="text-left p-2">{item.price?.toLocaleString('he-IL')} {currencySymbol}</td>
                    <td className="text-left p-2 font-semibold">{item.total?.toLocaleString('he-IL')} {currencySymbol}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={4} className="text-left p-2">סכום ביניים:</td>
                  <td className="text-left p-2">{subtotal.toLocaleString('he-IL')} {currencySymbol}</td>
                </tr>
                {content.showVat && (
                  <tr className="font-semibold">
                    <td colSpan={4} className="text-left p-2">מע"מ ({content.vatRate}%):</td>
                    <td className="text-left p-2">{vat.toLocaleString('he-IL')} {currencySymbol}</td>
                  </tr>
                )}
                <tr className="text-xl font-bold border-t-2">
                  <td colSpan={4} className="text-left p-2">סה"כ לתשלום:</td>
                  <td className="text-left p-2 text-blue-600 dark:text-blue-400">
                    {total.toLocaleString('he-IL')} {currencySymbol}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'payments':
        const totalPayments = content.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">לוח תשלומים</h2>
              <Badge variant="outline" className="text-lg">
                <DollarSign className="h-4 w-4 ml-1" />
                {totalPayments.toLocaleString('he-IL')} ₪
              </Badge>
            </div>
            <div className="space-y-3">
              {content.payments?.map((payment: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-900">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">תשלום {index + 1}</span>
                      <Badge variant={
                        payment.status === 'paid' ? 'default' :
                        payment.status === 'overdue' ? 'destructive' :
                        'secondary'
                      }>
                        {payment.status === 'paid' ? 'שולם' :
                         payment.status === 'overdue' ? 'באיחור' :
                         payment.status === 'cancelled' ? 'בוטל' : 'ממתין'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 inline ml-1" />
                      {new Date(payment.dueDate).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold">{payment.amount?.toLocaleString('he-IL')} ₪</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">לוח זמנים</h2>
            <div className="relative border-r-2 border-slate-300 pr-8 space-y-6">
              {content.milestones?.map((milestone: any, index: number) => (
                <div key={index} className="relative">
                  <div className={cn(
                    'absolute -right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white',
                    milestone.status === 'completed' ? 'border-green-500 bg-green-50' :
                    milestone.status === 'in-progress' ? 'border-blue-500 bg-blue-50' :
                    milestone.status === 'delayed' ? 'border-red-500 bg-red-50' :
                    'border-slate-300 bg-slate-50'
                  )}>
                    {milestone.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {milestone.status === 'in-progress' && <Clock className="h-4 w-4 text-blue-600" />}
                    {milestone.status === 'delayed' && <AlertCircle className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{milestone.title}</h3>
                      <Badge variant={
                        milestone.status === 'completed' ? 'default' :
                        milestone.status === 'in-progress' ? 'secondary' :
                        milestone.status === 'delayed' ? 'destructive' :
                        'outline'
                      }>
                        {milestone.status === 'completed' ? 'הושלם' :
                         milestone.status === 'in-progress' ? 'בתהליך' :
                         milestone.status === 'delayed' ? 'באיחור' : 'ממתין'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{milestone.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline ml-1" />
                      {new Date(milestone.date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">תנאים והתניות</h2>
            <div className="space-y-3">
              {content.terms?.map((term: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    'p-4 border rounded-lg',
                    term.important
                      ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300'
                      : 'bg-white dark:bg-slate-900'
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold">{index + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{term.title}</h3>
                        {term.important && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 ml-1" />
                            חשוב
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{term.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'signatures':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">חתימות</h2>
            <div className="grid grid-cols-2 gap-6">
              {content.signatures?.map((signature: any, index: number) => (
                <div key={index} className="space-y-3">
                  <div className="h-24 border-b-2 border-slate-800 flex items-end pb-2">
                    <span className="text-sm text-muted-foreground">חתימה</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{signature.name || '_________________'}</p>
                    <p className="text-sm text-muted-foreground">{signature.role}</p>
                    <p className="text-xs text-muted-foreground">
                      תאריך: {signature.date ? new Date(signature.date).toLocaleDateString('he-IL') : '_____'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notes':
        if (!content.showInDocument) return null;
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold mb-4">הערות</h2>
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm whitespace-pre-wrap">{content.notes || 'אין הערות'}</p>
            </div>
          </div>
        );

      case 'custom':
        if (content.html) {
          return (
            <div
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          );
        }
        return (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">{block.title}</h2>
            <p className="whitespace-pre-wrap">{content.text || ''}</p>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            תוכן הבלוק יוצג כאן
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'mb-6 p-6 rounded-lg transition-all',
        isSelected && `ring-2 ${getColorClasses()}`
      )}
    >
      {renderContent()}
    </div>
  );
}
