import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Signature, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { SignatureData, DocumentParty } from './types';

interface SignaturesEditorProps {
  signatures: SignatureData[];
  parties: DocumentParty[];
  onAddSignature: (signature: Omit<SignatureData, 'id'>) => void;
  onUpdateSignature: (id: string, updates: Partial<SignatureData>) => void;
  onRemoveSignature: (id: string) => void;
}

const defaultNewSignature: Omit<SignatureData, 'id'> = {
  partyId: '',
  name: '',
  role: '',
  signatureType: 'drawn',
  signatureData: '',
  signedAt: '',
  ipAddress: '',
};

export function SignaturesEditor({
  signatures,
  parties,
  onAddSignature,
  onUpdateSignature,
  onRemoveSignature,
}: SignaturesEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSignature, setNewSignature] = useState<Omit<SignatureData, 'id'>>(defaultNewSignature);
  const [editingSignature, setEditingSignature] = useState<SignatureData | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSignature = () => {
    if (!newSignature.name.trim()) return;
    onAddSignature({
      ...newSignature,
      signedAt: newSignature.signatureData ? new Date().toISOString() : '',
    });
    setNewSignature(defaultNewSignature);
    setIsAddDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingSignature) return;
    onUpdateSignature(editingSignature.id, editingSignature);
    setEditingSignature(null);
  };

  const handlePartySelect = (partyId: string, setter: (s: any) => void, current: any) => {
    const party = parties.find((p) => p.id === partyId);
    if (party) {
      setter({
        ...current,
        partyId,
        name: party.name,
        role: party.role || (party.type === 'company' ? 'נציג החברה' : party.type === 'client' ? 'לקוח' : 'צד'),
      });
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveCanvasAsSignature = (setter: (s: any) => void, current: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setter({
      ...current,
      signatureType: 'drawn',
      signatureData: dataUrl,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: any) => void, current: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setter({
        ...current,
        signatureType: 'image',
        signatureData: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const SignatureDialog = ({
    signature,
    setSignature,
    onSave,
    title,
  }: {
    signature: Omit<SignatureData, 'id'>;
    setSignature: (sig: Omit<SignatureData, 'id'>) => void;
    onSave: () => void;
    title: string;
  }) => (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {/* Party Selection */}
        {parties.length > 0 && (
          <div className="grid gap-2">
            <Label>בחר מהצדדים להסכם</Label>
            <Select
              value={signature.partyId || ''}
              onValueChange={(v) => handlePartySelect(v, setSignature, signature)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר צד מהרשימה" />
              </SelectTrigger>
              <SelectContent>
                {parties.map((party) => (
                  <SelectItem key={party.id} value={party.id}>
                    {party.name} {party.company && `(${party.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">שם החותם *</Label>
            <Input
              id="name"
              value={signature.name}
              onChange={(e) => setSignature({ ...signature, name: e.target.value })}
              placeholder="שם מלא"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">תפקיד</Label>
            <Input
              id="role"
              value={signature.role || ''}
              onChange={(e) => setSignature({ ...signature, role: e.target.value })}
              placeholder='לדוגמה: "מנכ"ל"'
            />
          </div>
        </div>

        {/* Signature Input */}
        <div className="grid gap-2">
          <Label>חתימה</Label>
          <Tabs defaultValue="draw" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw">ציור</TabsTrigger>
              <TabsTrigger value="type">הקלדה</TabsTrigger>
              <TabsTrigger value="upload">העלאה</TabsTrigger>
            </TabsList>
            
            <TabsContent value="draw" className="mt-2">
              <div className="border rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="border rounded cursor-crosshair w-full touch-none"
                  style={{ background: '#fafafa' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                  >
                    נקה
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveCanvasAsSignature(setSignature, signature)}
                  >
                    שמור חתימה
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="type" className="mt-2">
              <div className="grid gap-2">
                <Input
                  value={signature.signatureType === 'typed' ? signature.signatureData : ''}
                  onChange={(e) =>
                    setSignature({
                      ...signature,
                      signatureType: 'typed',
                      signatureData: e.target.value,
                    })
                  }
                  placeholder="הקלד את שמך כחתימה"
                  className="font-signature text-2xl h-12"
                  style={{ fontFamily: 'cursive' }}
                />
                <p className="text-xs text-muted-foreground">
                  החתימה תוצג בפונט מיוחד
                </p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-2">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setSignature, signature)}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  בחר קובץ תמונה
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG או GIF עד 2MB
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        {signature.signatureData && (
          <div className="grid gap-2">
            <Label>תצוגה מקדימה</Label>
            <div className="border rounded-lg p-4 bg-white flex items-center justify-center min-h-[80px]">
              {signature.signatureType === 'typed' ? (
                <span
                  className="text-3xl"
                  style={{ fontFamily: 'cursive' }}
                >
                  {signature.signatureData}
                </span>
              ) : (
                <img
                  src={signature.signatureData}
                  alt="חתימה"
                  className="max-h-20 max-w-full"
                />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setSignature({ ...signature, signatureData: '', signatureType: 'drawn' })
              }
            >
              <X className="h-4 w-4 ml-1" />
              מחק חתימה
            </Button>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={!signature.name.trim()}>
          שמור
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">חתימות</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                הוסף חתימה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <SignatureDialog
                signature={newSignature}
                setSignature={setNewSignature}
                onSave={handleAddSignature}
                title="הוספת חתימה"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {signatures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Signature className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>אין חתימות</p>
            <p className="text-sm mt-1">הוסף חתימות של הצדדים להסכם</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className={cn(
                  'border rounded-lg p-3 bg-background transition-colors',
                  sig.signatureData && 'border-green-200 bg-green-50/50'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                      sig.signatureData
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {sig.signatureData ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Signature className="h-5 w-5" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sig.name}</span>
                      {sig.role && (
                        <Badge variant="outline" className="text-xs">
                          {sig.role}
                        </Badge>
                      )}
                      <Badge
                        variant={sig.signatureData ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {sig.signatureData ? 'חתום' : 'ממתין לחתימה'}
                      </Badge>
                    </div>
                    {sig.signedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        נחתם ב-{format(new Date(sig.signedAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </p>
                    )}
                  </div>

                  {/* Signature Preview */}
                  {sig.signatureData && (
                    <div className="h-12 w-24 border rounded bg-white flex items-center justify-center overflow-hidden">
                      {sig.signatureType === 'typed' ? (
                        <span className="text-sm" style={{ fontFamily: 'cursive' }}>
                          {sig.signatureData}
                        </span>
                      ) : (
                        <img
                          src={sig.signatureData}
                          alt="חתימה"
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Dialog
                      open={editingSignature?.id === sig.id}
                      onOpenChange={(open) => setEditingSignature(open ? sig : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        {editingSignature && (
                          <SignatureDialog
                            signature={editingSignature}
                            setSignature={(s) =>
                              setEditingSignature({
                                ...editingSignature,
                                ...s,
                              } as SignatureData)
                            }
                            onSave={handleSaveEdit}
                            title="עריכת חתימה"
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת חתימה</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את החתימה של "{sig.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRemoveSignature(sig.id)}>
                            מחק
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {signatures.length > 0 && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {signatures.filter((s) => s.signatureData).length} מתוך {signatures.length} חתומים
            </span>
            {signatures.every((s) => s.signatureData) && (
              <Badge className="bg-green-500">
                <Check className="h-3 w-3 ml-1" />
                כל הצדדים חתמו
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
