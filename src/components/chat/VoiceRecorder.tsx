/**
 * VoiceRecorder - קומפוננט הקלטה קולית בצ'אט
 * Record + upload to Supabase storage
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Send, X, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onRecorded: (audioUrl: string, durationSeconds: number, blob: Blob) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onRecorded, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/mp4') ? { mimeType: 'audio/mp4' } : {};
      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const audio = new Audio(url);
        audio.onloadedmetadata = () => setAudioDuration(Math.floor(audio.duration));
        audioRef.current = audio;
      };
      mr.start(100);
      setRecording(true);
      startTimer();
    } catch (err) {
      toast({ title: 'שגיאה', description: 'לא ניתן לגשת למיקרופון', variant: 'destructive' });
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    stopTimer();
    setRecording(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); audioRef.current.onended = () => setPlaying(false); }
  };

  const handleSend = async () => {
    if (!blobRef.current) return;
    setUploading(true);
    try {
      const ext = blobRef.current.type.includes('mp4') ? 'mp4' : 'webm';
      const path = `voice-messages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('documents').upload(path, blobRef.current, {
        contentType: blobRef.current.type,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      onRecorded(urlData.publicUrl, audioDuration || duration, blobRef.current);
    } catch {
      toast({ title: 'שגיאה בהעלאה', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-3 py-2 w-full">
      {!audioUrl ? (
        // Recording state
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <Mic className="h-4 w-4 text-white" />
            </div>
            {/* Waveform visualization */}
            <div className="flex items-center gap-0.5 flex-1 h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={cn(
                  'w-1 rounded-full bg-red-400 transition-all',
                  recording && !paused ? 'animate-pulse' : ''
                )} style={{ height: `${Math.random() * 16 + 4}px`, animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
            <span className="text-sm font-mono text-red-700 shrink-0">{formatDuration(duration)}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={stopRecording}>
            <Square className="h-4 w-4 fill-red-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        // Preview state
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={togglePlay}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full">
                <div className="h-full bg-primary rounded-full w-0 transition-all" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{formatDuration(audioDuration || duration)}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="icon" className="h-8 w-8 bg-primary text-primary-foreground rounded-xl" onClick={handleSend} disabled={uploading}>
            {uploading ? <span className="animate-spin text-xs">⏳</span> : <Send className="h-4 w-4" />}
          </Button>
        </>
      )}
    </div>
  );
}
