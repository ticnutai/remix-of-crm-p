import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VATCalculatorProps {
  contractId: string;
  price: string;
  vatIncluded?: boolean;
  vatAmount?: string;
  onCalculate: (contractId: string, includeVAT: boolean) => void;
}

export function VATCalculator({
  contractId,
  price,
  vatIncluded = false,
  vatAmount,
  onCalculate,
}: VATCalculatorProps) {
  const cleanPrice = price.replace(/[^0-9.]/g, '');
  const basePrice = parseFloat(cleanPrice) || 0;
  const calculatedVAT = basePrice * 0.17;
  const totalWithVAT = basePrice + calculatedVAT;

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">מחשבון מע"מ</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="vat-toggle" className="text-sm text-blue-700">
            כולל מע"מ
          </Label>
          <Switch
            id="vat-toggle"
            checked={vatIncluded}
            onCheckedChange={(checked) => onCalculate(contractId, checked)}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">מחיר בסיס:</span>
          <span className="font-semibold text-gray-900">
            ₪{basePrice.toLocaleString('he-IL')}
          </span>
        </div>
        
        {vatIncluded && (
          <>
            <div className="flex justify-between items-center text-blue-700">
              <span>מע"מ (17%):</span>
              <span className="font-semibold">
                ₪{calculatedVAT.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-blue-300">
              <span className="font-bold text-blue-900">סה"כ כולל מע"מ:</span>
              <span className="font-bold text-lg text-blue-900">
                ₪{totalWithVAT.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
