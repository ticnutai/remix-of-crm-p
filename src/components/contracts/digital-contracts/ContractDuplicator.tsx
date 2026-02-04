import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ContractDuplicatorProps {
  contractId: string;
  contractTitle: string;
  onDuplicate: (contractId: string) => string | null;
}

export function ContractDuplicator({
  contractId,
  contractTitle,
  onDuplicate,
}: ContractDuplicatorProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleDuplicate = () => {
    const newId = onDuplicate(contractId);
    if (newId) {
      setCopied(true);
      toast({
        title: "החוזה שוכפל בהצלחה",
        description: `נוצר עותק חדש של "${contractTitle}"`,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-purple-900 mb-1">שכפול חוזה</h3>
          <p className="text-sm text-purple-700">
            צור עותק של החוזה עם כל הנתונים
          </p>
        </div>
        <Button
          onClick={handleDuplicate}
          variant="outline"
          size="lg"
          className={`flex items-center gap-2 transition-all ${
            copied
              ? "bg-green-100 border-green-400 text-green-700"
              : "bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              הועתק!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              שכפל חוזה
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
