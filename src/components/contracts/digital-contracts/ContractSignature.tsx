import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Check, X } from "lucide-react";
import { SignatureDialog } from "@/components/signatures/SignaturePad";

interface ContractSignatureProps {
  contractId: string;
  signatureData?: string;
  signedBy?: string;
  signedAt?: string;
  onSign: (contractId: string, signatureData: string, signerName: string) => void;
}

export function ContractSignature({
  contractId,
  signatureData,
  signedBy,
  signedAt,
  onSign,
}: ContractSignatureProps) {
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  const handleSigned = (signature: string, name: string) => {
    onSign(contractId, signature, name);
    setShowSignatureDialog(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (signatureData) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            <h3 className="font-semibold">החוזה נחתם</h3>
          </div>

          <div className="bg-white p-3 rounded-lg border-2 border-green-200">
            <img
              src={signatureData}
              alt="Signature"
              className="max-h-24 mx-auto"
            />
          </div>

          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>נחתם על ידי:</strong> {signedBy}
            </p>
            {signedAt && (
              <p>
                <strong>תאריך חתימה:</strong> {formatDate(signedAt)}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">חתימה דיגיטלית</h3>
            <p className="text-sm text-orange-700">
              החתם על החוזה באמצעות חתימה דיגיטלית
            </p>
          </div>
          <Button
            onClick={() => setShowSignatureDialog(true)}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <PenTool className="ml-2 h-5 w-5" />
            חתום כעת
          </Button>
        </div>
      </Card>

      <SignatureDialog
        open={showSignatureDialog}
        onOpenChange={setShowSignatureDialog}
        onSigned={handleSigned}
        documentType="contract"
        documentId={contractId}
      />
    </>
  );
}
