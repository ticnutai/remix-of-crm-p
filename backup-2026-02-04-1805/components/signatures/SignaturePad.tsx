import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pen, Eraser, Check, X, Download } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureData: string, signerName: string) => void;
  onCancel: () => void;
  documentType: 'quote' | 'contract' | 'invoice' | 'document';
  documentId: string;
}

export function SignaturePad({ onSave, onCancel, documentType, documentId }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    // Set drawing style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill white background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    setHasSignature(true);
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = async () => {
    if (!signerName.trim()) {
      toast({ title: 'נא להזין שם החותם', variant: 'destructive' });
      return;
    }
    
    if (!hasSignature) {
      toast({ title: 'נא לחתום על המסמך', variant: 'destructive' });
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL('image/png');
    
    try {
      // Save signature to database
      await (supabase as any).from('signatures').insert({
        document_type: documentType,
        document_id: documentId,
        signer_name: signerName,
        signature_data: signatureData,
        signature_type: 'drawn',
        ip_address: null, // Could be fetched from API
        user_agent: navigator.userAgent,
      });
      
      onSave(signatureData, signerName);
      toast({ title: 'החתימה נשמרה בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בשמירת החתימה', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="h-5 w-5" />
          חתימה דיגיטלית
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">שם החותם</label>
          <Input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="הזן את שמך המלא"
            className="mt-1"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">חתימה</label>
          <div className="mt-1 border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: 200 }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            חתום בעזרת העכבר או האצבע
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Check className="h-4 w-4 ml-2" />
            אשר חתימה
          </Button>
          <Button variant="outline" onClick={clearCanvas}>
            <Eraser className="h-4 w-4 ml-2" />
            נקה
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 ml-2" />
            ביטול
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'quote' | 'contract' | 'invoice' | 'document';
  documentId: string;
  onSigned: (signatureData: string, signerName: string) => void;
}

export function SignatureDialog({ 
  open, 
  onOpenChange, 
  documentType, 
  documentId,
  onSigned 
}: SignatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <SignaturePad
          documentType={documentType}
          documentId={documentId}
          onSave={(data, name) => {
            onSigned(data, name);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default SignaturePad;
