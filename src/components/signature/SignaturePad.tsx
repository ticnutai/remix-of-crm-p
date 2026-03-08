// Digital Signature Component - tenarch CRM Pro
// קומפוננט חתימה דיגיטלית על מסמכים

import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PenTool,
  Type,
  Upload,
  Trash2,
  Check,
  X,
  RotateCcw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export interface SignatureData {
  type: 'draw' | 'type' | 'upload';
  data: string; // base64 for draw/upload, text for type
  name: string;
  email?: string;
  date: string;
  ip?: string;
  userAgent?: string;
}

interface SignaturePadProps {
  onSave: (signature: SignatureData) => void;
  onCancel: () => void;
  signerName?: string;
  signerEmail?: string;
  documentTitle?: string;
  className?: string;
}

export function SignaturePad({
  onSave,
  onCancel,
  signerName = '',
  signerEmail = '',
  documentTitle,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [name, setName] = useState(signerName);
  const [email, setEmail] = useState(signerEmail);
  const [agreed, setAgreed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Set drawing styles
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedSignature(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Get signature data based on type
  const getSignatureData = (): string | null => {
    switch (signatureType) {
      case 'draw':
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return null;
        return canvas.toDataURL('image/png');
      case 'type':
        if (!typedSignature.trim()) return null;
        return typedSignature;
      case 'upload':
        return uploadedSignature;
      default:
        return null;
    }
  };

  // Validate and save
  const handleSave = () => {
    const signatureData = getSignatureData();
    if (!signatureData || !name.trim() || !agreed) return;

    onSave({
      type: signatureType,
      data: signatureData,
      name: name.trim(),
      email: email.trim() || undefined,
      date: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  };

  const isValid = () => {
    const hasSignature = signatureType === 'draw' ? hasDrawn :
                         signatureType === 'type' ? typedSignature.trim() !== '' :
                         uploadedSignature !== null;
    return hasSignature && name.trim() !== '' && agreed;
  };

  return (
    <Card className={cn("max-w-2xl mx-auto", className)} dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5 text-primary" />
          חתימה דיגיטלית
        </CardTitle>
        {documentTitle && (
          <CardDescription>חתימה על: {documentTitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Signature Type Tabs */}
        <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as typeof signatureType)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="draw" className="gap-2">
              <PenTool className="h-4 w-4" />
              צייר
            </TabsTrigger>
            <TabsTrigger value="type" className="gap-2">
              <Type className="h-4 w-4" />
              הקלד
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              העלה
            </TabsTrigger>
          </TabsList>

          {/* Draw Signature */}
          <TabsContent value="draw" className="space-y-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-white cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 left-2"
                onClick={clearCanvas}
              >
                <RotateCcw className="h-4 w-4 ml-1" />
                נקה
              </Button>
            </div>
            {!hasDrawn && (
              <p className="text-sm text-muted-foreground text-center">
                צייר את חתימתך בתוך המסגרת
              </p>
            )}
          </TabsContent>

          {/* Type Signature */}
          <TabsContent value="type" className="space-y-4">
            <Input
              placeholder="הקלד את שמך המלא"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              className="text-2xl h-16 text-center"
              style={{ fontFamily: 'cursive, serif' }}
            />
            {typedSignature && (
              <div className="p-4 bg-white rounded-lg border text-center">
                <span className="text-3xl" style={{ fontFamily: 'cursive, serif' }}>
                  {typedSignature}
                </span>
              </div>
            )}
          </TabsContent>

          {/* Upload Signature */}
          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {uploadedSignature ? (
                <div className="relative">
                  <img
                    src={uploadedSignature}
                    alt="Signature"
                    className="max-h-40 rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -left-2"
                    onClick={() => setUploadedSignature(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">לחץ להעלאת תמונת חתימה</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Signer Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="signer-name">שם מלא *</Label>
            <Input
              id="signer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הזן את שמך המלא"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signer-email">אימייל</Label>
            <Input
              id="signer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
          <Checkbox
            id="agreement"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <label htmlFor="agreement" className="text-sm leading-relaxed cursor-pointer">
            אני מאשר/ת כי החתימה הדיגיטלית שלעיל היא חתימתי החוקית ואני מסכים/ה 
            לתנאי המסמך. אני מבין/ה שחתימה זו מחייבת מבחינה משפטית.
          </label>
        </div>

        {/* Timestamp */}
        <div className="text-sm text-muted-foreground text-center">
          תאריך: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={!isValid()} className="gap-2">
            <Check className="h-4 w-4" />
            אשר וחתום
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Signature Dialog Component
interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (signature: SignatureData) => void;
  documentTitle?: string;
  signerName?: string;
  signerEmail?: string;
}

export function SignatureDialog({
  open,
  onOpenChange,
  onSign,
  documentTitle,
  signerName,
  signerEmail,
}: SignatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <SignaturePad
          onSave={(sig) => {
            onSign(sig);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
          documentTitle={documentTitle}
          signerName={signerName}
          signerEmail={signerEmail}
        />
      </DialogContent>
    </Dialog>
  );
}

// Signature Display Component
interface SignatureDisplayProps {
  signature: SignatureData;
  className?: string;
}

export function SignatureDisplay({ signature, className }: SignatureDisplayProps) {
  return (
    <div className={cn("p-4 border rounded-lg bg-muted/30", className)} dir="rtl">
      <div className="flex items-start gap-4">
        {/* Signature Image/Text */}
        <div className="flex-shrink-0 w-48 h-20 bg-white rounded border flex items-center justify-center">
          {signature.type === 'type' ? (
            <span className="text-xl" style={{ fontFamily: 'cursive, serif' }}>
              {signature.data}
            </span>
          ) : (
            <img
              src={signature.data}
              alt="Signature"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Signature Details */}
        <div className="flex-1 space-y-1 text-sm">
          <p className="font-medium">{signature.name}</p>
          {signature.email && (
            <p className="text-muted-foreground">{signature.email}</p>
          )}
          <p className="text-muted-foreground">
            נחתם ב: {format(new Date(signature.date), 'dd/MM/yyyy HH:mm', { locale: he })}
          </p>
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-3 w-3" />
            <span className="text-xs">חתימה מאומתת</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing signatures
export function useSignature(documentId: string) {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load signature from localStorage (in production, use database)
  useEffect(() => {
    const saved = localStorage.getItem(`signature-${documentId}`);
    if (saved) {
      setSignature(JSON.parse(saved));
    }
  }, [documentId]);

  const sign = (sig: SignatureData) => {
    setSignature(sig);
    localStorage.setItem(`signature-${documentId}`, JSON.stringify(sig));
  };

  const clearSignature = () => {
    setSignature(null);
    localStorage.removeItem(`signature-${documentId}`);
  };

  return {
    signature,
    isSigned: signature !== null,
    sign,
    clearSignature,
    isDialogOpen,
    setIsDialogOpen,
  };
}
