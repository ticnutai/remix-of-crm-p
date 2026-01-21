// Floating Timer Button - e-control CRM Pro - Luxurious Navy & Gold Design
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimerWidget } from './TimerWidget';
import { TimeEntriesList } from './TimeEntriesList';
import { TimerSettingsDialog } from './TimerSettingsDialog';
import { TimerThemeProvider, useTimerTheme } from './TimerThemeContext';
import { Timer, Play, Square, Clock, Sparkles, Gem, Star, Palette, Pause, Save, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
const TIMER_POSITION_KEY = 'timer-position';
const TIMER_SIZE_KEY = 'timer-size';

// Preset sizes for mobile quick resize
const SIZE_PRESETS = {
  small: {
    width: 260,
    height: 400
  },
  medium: {
    width: 320,
    height: 500
  },
  large: {
    width: 380,
    height: 600
  }
};
function FloatingTimerContent() {
  const {
    timerState,
    todayTotal,
    weekTotal,
    stopTimer,
    resumeTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    saveEntry
  } = useTimer();
  const {
    theme: timerTheme,
    setTheme: setTimerTheme
  } = useTimerTheme();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(TIMER_POSITION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure position is within screen bounds
        const safeX = Math.min(Math.max(0, parsed.x), (typeof window !== 'undefined' ? window.innerWidth : 800) - 80);
        const safeY = Math.min(Math.max(0, parsed.y), (typeof window !== 'undefined' ? window.innerHeight : 600) - 80);
        return {
          x: safeX,
          y: safeY
        };
      } catch {
        // Fall through to default
      }
    }
    // Default position: bottom-left corner
    return {
      x: 32,
      y: typeof window !== 'undefined' ? window.innerHeight - 100 : 600
    };
  });

  // Keep timer in bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(Math.max(0, prev.x), window.innerWidth - 80),
        y: Math.min(Math.max(0, prev.y), window.innerHeight - 80)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0
  });

  // Resize state for popover
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<string | null>(null);
  const [currentSizePreset, setCurrentSizePreset] = useState<'small' | 'medium' | 'large'>('medium');
  const [popoverSize, setPopoverSize] = useState(() => {
    const saved = localStorage.getItem(TIMER_SIZE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {/* ignore */}
    }
    return {
      width: 288,
      height: 500
    };
  });
  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    w: 0,
    h: 0
  });

  // Save popover size
  useEffect(() => {
    localStorage.setItem(TIMER_SIZE_KEY, JSON.stringify(popoverSize));
  }, [popoverSize]);

  // Resize handlers - supports both mouse and touch
  const onResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDir(dir);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = {
      x: clientX,
      y: clientY,
      w: popoverSize.width,
      h: popoverSize.height
    };

    // Vibrate on mobile for feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }, [popoverSize]);
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - resizeStartRef.current.x;
      const dy = clientY - resizeStartRef.current.y;
      let newW = resizeStartRef.current.w;
      let newH = resizeStartRef.current.h;
      if (resizeDir?.includes('e')) newW = Math.max(250, Math.min(600, resizeStartRef.current.w + dx));
      if (resizeDir?.includes('w')) newW = Math.max(250, Math.min(600, resizeStartRef.current.w - dx));
      if (resizeDir?.includes('s')) newH = Math.max(350, Math.min(800, resizeStartRef.current.h + dy));
      if (resizeDir?.includes('n')) newH = Math.max(350, Math.min(800, resizeStartRef.current.h - dy));
      setPopoverSize({
        width: newW,
        height: newH
      });
    };
    const onUp = () => {
      setIsResizing(false);
      setResizeDir(null);
    };

    // Add both mouse and touch listeners
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, {
      passive: false
    });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, [isResizing, resizeDir]);

  // Mobile quick resize - cycle through presets
  const cycleSizePreset = useCallback(() => {
    const presets: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const currentIndex = presets.indexOf(currentSizePreset);
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextPreset = presets[nextIndex];
    setCurrentSizePreset(nextPreset);
    setPopoverSize(SIZE_PRESETS[nextPreset]);

    // Vibrate on mobile for feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    toast.success(`גודל: ${nextPreset === 'small' ? 'קטן' : nextPreset === 'medium' ? 'בינוני' : 'גדול'}`);
  }, [currentSizePreset]);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem(TIMER_POSITION_KEY, JSON.stringify(position));
  }, [position]);

  // Handle drag start (for long press)
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: position.x,
      posY: position.y
    };
  }, [position]);

  // Long press handlers for dragging the main timer button
  const handleLongPressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Clear any existing timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: position.x,
      posY: position.y
    };

    // Start long press timer (300ms)
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      setIsDragging(true);
      // Vibrate on mobile for feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 300);
  }, [position]);
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Small delay before resetting to allow click events
    setTimeout(() => {
      setIsLongPress(false);
    }, 100);
  }, []);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;
      const newX = Math.max(0, Math.min(window.innerWidth - 80, dragStartRef.current.posX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, dragStartRef.current.posY + deltaY));
      setPosition({
        x: newX,
        y: newY
      });
    };
    const handleEnd = () => {
      setIsDragging(false);
      setIsLongPress(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs} שעות ${mins} דק׳`;
    return `${mins} דקות`;
  };
  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerState.isRunning) {
      stopTimer();
    } else if (timerState.currentEntry) {
      resumeTimer();
    }
  };
  return <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="fixed z-[9999] flex flex-row-reverse items-center gap-3 group" dir="rtl" style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}>
          {/* Main Timer Button - Circular Navy with Gold Border - Long press to drag */}
          <button onMouseDown={handleLongPressStart} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd} onTouchStart={handleLongPressStart} onTouchEnd={handleLongPressEnd} className={cn("group relative h-16 w-16 rounded-full transition-all duration-500 ease-out", "bg-gradient-to-br from-[hsl(220,60%,20%)] via-[hsl(220,60%,25%)] to-[hsl(220,60%,18%)]", "border-2 border-[hsl(45,80%,50%)]", "shadow-[0_0_20px_rgba(180,140,50,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]", "hover:shadow-[0_0_30px_rgba(180,140,50,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]", "hover:scale-105 active:scale-95", "focus:outline-none focus:ring-2 focus:ring-[hsl(45,80%,50%)]/50 focus:ring-offset-2", timerState.isRunning && ["border-[hsl(45,90%,55%)]", "shadow-[0_0_25px_rgba(200,160,60,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]"], isDragging && "cursor-grabbing scale-110 shadow-[0_0_40px_rgba(180,140,50,0.7)]", isLongPress && "scale-110 ring-4 ring-[hsl(45,80%,50%)]/50")}>
            {/* Static glow when running */}
            {timerState.isRunning && <span className="absolute inset-0 rounded-full bg-[hsl(45,80%,50%)]/15" />}
            
            <span className="relative flex items-center justify-center h-full w-full">
              <Timer className={cn("h-7 w-7 transition-colors duration-300", timerState.isRunning ? "text-[hsl(45,85%,60%)]" : "text-[hsl(45,70%,55%)] group-hover:text-[hsl(45,85%,65%)]")} strokeWidth={1.8} />
            </span>
          </button>

          {/* Floating Timer Badge - Navy & Gold Theme */}
          {(timerState.isRunning || timerState.elapsed > 0) && <div className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl", "bg-gradient-to-l from-[hsl(220,60%,18%)] via-[hsl(220,60%,22%)] to-[hsl(220,60%,20%)]", "border-2 border-[hsl(45,80%,50%)]", "shadow-[0_0_20px_rgba(180,140,50,0.25)]", "animate-fade-in cursor-pointer", "hover:shadow-[0_0_30px_rgba(180,140,50,0.4)] transition-all duration-300")} onClick={() => setOpen(true)}>
              {/* Quick Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Play/Pause Button */}
                <button onClick={e => {
              e.stopPropagation();
              if (timerState.isRunning) {
                pauseTimer();
              } else if (timerState.currentEntry) {
                resumeTimer();
              }
            }} className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200", "hover:scale-105 active:scale-95", "shadow-lg")} style={{
              background: timerState.isRunning ? `linear-gradient(135deg, ${timerTheme.controlButtonsActiveColor || 'hsl(45,80%,50%)'}, ${timerTheme.controlButtonsActiveColor || 'hsl(45,90%,40%)'})` : `linear-gradient(135deg, ${timerTheme.controlButtonsIdleColor || 'hsl(45,80%,55%)'}, ${timerTheme.controlButtonsIdleColor || 'hsl(45,90%,45%)'})`,
              color: timerTheme.playButtonColor || 'hsl(220,60%,15%)',
              boxShadow: `0 4px 15px ${timerTheme.controlButtonsActiveColor || 'hsl(45,80%,50%)'}40`
            }}>
                  {timerState.isRunning ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current mr-[-1px]" />}
                </button>

                {/* Stop Button */}
                {(timerState.isRunning || timerState.currentEntry) && <button onClick={e => {
              e.stopPropagation();
              stopTimer();
            }} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200", "hover:scale-105 active:scale-95", "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/30")}>
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>}

                {/* Reset Button */}
                {timerState.elapsed > 0 && <button onClick={e => {
              e.stopPropagation();
              resetTimer();
            }} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200", "hover:scale-105 active:scale-95", "border")} style={{
              borderColor: timerState.isRunning ? `${timerTheme.controlButtonsActiveColor || 'hsl(45,80%,50%)'}80` : 'rgba(255,255,255,0.3)',
              color: timerState.isRunning ? timerTheme.controlButtonsActiveColor || 'hsl(45,80%,60%)' : timerTheme.controlButtonsIdleColor || 'white'
            }}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>}
              </div>
              
              {/* Timer Display */}
              <div className="flex flex-col items-start text-right">
                <span className={cn("font-mono font-bold tracking-wider leading-none antialiased", timerState.isRunning && "drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]")} style={{
              fontSize: `${Math.min((timerTheme.timerDisplayFontSize || 28) * 0.75, 24)}px`,
              color: timerState.isRunning ? timerTheme.controlButtonsActiveColor || 'hsl(45, 85%, 60%)' : timerTheme.timerDigitsColor || 'hsl(0, 0%, 100%)'
            }}>
                  {formatTime(timerState.elapsed)}
                </span>
                {timerState.currentEntry?.description && <span className="text-[11px] mt-1 max-w-[120px] truncate text-right" style={{
              color: timerTheme.labelsColor || 'hsl(45,60%,70%)'
            }}>
                    {timerState.currentEntry.description}
                  </span>}
              </div>
            </div>}
        </div>
      </PopoverTrigger>
      
      <PopoverContent side="top" align="start" sideOffset={16} className="p-0 rounded-3xl overflow-visible shadow-[0_0_60px_rgba(180,140,50,0.3),0_25px_60px_-15px_rgba(0,0,0,0.5)] relative" style={{
      width: popoverSize.width,
      minHeight: popoverSize.height,
      backgroundColor: timerTheme.backgroundColor,
      borderWidth: `${timerTheme.borderWidth || 3}px`,
      borderStyle: 'solid',
      borderColor: timerTheme.borderColor,
      fontFamily: `"${timerTheme.fontFamily || 'Heebo'}", sans-serif`,
      fontSize: `${timerTheme.fontSize || 14}px`,
      lineHeight: timerTheme.lineHeight || 1.5
    }} dir="rtl">
        {/* Resize Handles - 8 directions - Touch & Mouse support */}
        {/* Corners - larger touch targets for mobile */}
        <div className="absolute -top-2 -right-2 w-8 h-8 cursor-ne-resize z-50 hover:bg-[hsl(45,80%,50%)]/30 active:bg-[hsl(45,80%,50%)]/50 rounded-full transition-colors touch-none" onMouseDown={e => onResizeStart(e, 'ne')} onTouchStart={e => onResizeStart(e, 'ne')} />
        <div className="absolute -top-2 -left-2 w-8 h-8 cursor-nw-resize z-50 hover:bg-[hsl(45,80%,50%)]/30 active:bg-[hsl(45,80%,50%)]/50 rounded-full transition-colors touch-none" onMouseDown={e => onResizeStart(e, 'nw')} onTouchStart={e => onResizeStart(e, 'nw')} />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 cursor-se-resize z-50 hover:bg-[hsl(45,80%,50%)]/30 active:bg-[hsl(45,80%,50%)]/50 rounded-full transition-colors touch-none" onMouseDown={e => onResizeStart(e, 'se')} onTouchStart={e => onResizeStart(e, 'se')} />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 cursor-sw-resize z-50 hover:bg-[hsl(45,80%,50%)]/30 active:bg-[hsl(45,80%,50%)]/50 rounded-full transition-colors touch-none" onMouseDown={e => onResizeStart(e, 'sw')} onTouchStart={e => onResizeStart(e, 'sw')} />
        {/* Edges - larger for touch */}
        <div className="absolute -top-2 left-8 right-8 h-4 cursor-n-resize z-40 touch-none" onMouseDown={e => onResizeStart(e, 'n')} onTouchStart={e => onResizeStart(e, 'n')} />
        <div className="absolute -bottom-2 left-8 right-8 h-4 cursor-s-resize z-40 touch-none" onMouseDown={e => onResizeStart(e, 's')} onTouchStart={e => onResizeStart(e, 's')} />
        <div className="absolute -left-2 top-8 bottom-8 w-4 cursor-w-resize z-40 touch-none" onMouseDown={e => onResizeStart(e, 'w')} onTouchStart={e => onResizeStart(e, 'w')} />
        <div className="absolute -right-2 top-8 bottom-8 w-4 cursor-e-resize z-40 touch-none" onMouseDown={e => onResizeStart(e, 'e')} onTouchStart={e => onResizeStart(e, 'e')} />
        
        {/* Visual resize indicators - larger and more visible for mobile */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-[hsl(45,80%,50%)]/60 cursor-s-resize z-50 touch-none active:bg-[hsl(45,80%,50%)]/80" onMouseDown={e => onResizeStart(e, 's')} onTouchStart={e => onResizeStart(e, 's')} />
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-16 rounded-full bg-[hsl(45,80%,50%)]/60 cursor-e-resize z-50 touch-none active:bg-[hsl(45,80%,50%)]/80" onMouseDown={e => onResizeStart(e, 'e')} onTouchStart={e => onResizeStart(e, 'e')} />
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-16 rounded-full bg-[hsl(45,80%,50%)]/60 cursor-w-resize z-50 touch-none active:bg-[hsl(45,80%,50%)]/80" onMouseDown={e => onResizeStart(e, 'w')} onTouchStart={e => onResizeStart(e, 'w')} />
        
        {/* Decorative corner ornaments */}
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-xl opacity-60 pointer-events-none" style={{
        borderColor: timerTheme.accentColor
      }} />
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-xl opacity-60 pointer-events-none" style={{
        borderColor: timerTheme.accentColor
      }} />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-xl opacity-60 pointer-events-none" style={{
        borderColor: timerTheme.accentColor
      }} />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-xl opacity-60 pointer-events-none" style={{
        borderColor: timerTheme.accentColor
      }} />
        
        {/* Timer Display Header - Main Timer at Top with Rounded Corners */}
        <div className="relative px-6 py-5 border-b-2 group rounded-t-3xl" style={{
        backgroundColor: timerTheme.backgroundColor,
        borderColor: `${timerTheme.borderColor}66`
      }}>
          {/* Abstract decorative elements */}
          <div className="absolute top-3 left-16 opacity-20">
            <Sparkles className="h-5 w-5" style={{
            color: timerTheme.accentColor
          }} />
          </div>
          <div className="absolute bottom-3 right-24 opacity-15">
            <Gem className="h-4 w-4" style={{
            color: timerTheme.accentColor
          }} />
          </div>
          
          {/* Main Timer Display */}
          <div className="flex flex-col items-center gap-4">
            {/* Large Timer Numbers - Light weight */}
            <div className={cn("font-light tracking-widest text-center transition-all duration-300", timerState.isRunning && "drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]")} style={{
            fontSize: `${timerTheme.timerDisplayFontSize || 48}px`,
            fontFamily: `"${timerTheme.timerFontFamily || 'JetBrains Mono'}", monospace`,
            color: timerState.isRunning ? timerTheme.accentColor || 'hsl(45, 85%, 55%)' : timerTheme.timerDigitsColor || 'hsl(0, 0%, 100%)',
            letterSpacing: '0.15em'
          }}>
              {formatTime(timerState.elapsed)}
            </div>
            
            {/* Control Buttons Row - White/Light buttons */}
            <div className="flex items-center gap-4">
              {/* Stop Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={async () => {
                    await stopTimer();
                  }} disabled={!timerState.isRunning && timerState.elapsed === 0} className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200", "hover:scale-110 active:scale-95 border", "disabled:opacity-30 disabled:cursor-not-allowed", "bg-white/10 border-white/30 hover:bg-white/20")}>
                      <Square className="h-4 w-4 text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>עצור</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Pause/Resume Button - Main action */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => timerState.isRunning ? pauseTimer() : resumeTimer()} disabled={timerState.elapsed === 0} className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 border-2 disabled:cursor-not-allowed shadow-lg", timerState.isRunning ? "bg-white/20 border-white/40 hover:bg-white/30" : "bg-white border-[#d8ac27] hover:bg-gray-50")}>
                      {timerState.isRunning ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-[#d8ac27]" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{timerState.isRunning ? 'השהה' : 'המשך'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Save Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={async () => {
                    await saveEntry();
                    toast.success('הזמן נשמר בהצלחה');
                  }} disabled={timerState.elapsed === 0} className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200", "hover:scale-110 active:scale-95 border", "disabled:opacity-30 disabled:cursor-not-allowed", "bg-white/10 border-white/30 hover:bg-white/20")}>
                      <Save className="h-4 w-4 text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>שמור</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Today Total - Small */}
            <p className="antialiased" style={{
            color: timerTheme.labelsColor || timerTheme.accentColor,
            fontSize: `${timerTheme.labelsFontSize || 12}px`
          }}>
              היום: {formatMinutes(todayTotal)}
            </p>
          </div>
          
          {/* Settings & Resize Buttons */}
          <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-200">
            {/* Mobile Resize Button - Always visible on mobile */}
            {isMobile && <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={cycleSizePreset} className="p-2 rounded-xl transition-all border border-transparent hover:opacity-80 active:scale-95" style={{
                  color: timerTheme.accentColor
                }}>
                      {currentSizePreset === 'small' ? <Minimize2 className="h-4 w-4" /> : currentSizePreset === 'large' ? <Maximize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4 opacity-60" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    שנה גודל ({currentSizePreset === 'small' ? 'קטן' : currentSizePreset === 'medium' ? 'בינוני' : 'גדול'})
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
            
            {/* Settings Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-xl transition-all border border-transparent hover:opacity-80" style={{
                  color: timerTheme.accentColor
                }}>
                    <Palette className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">הגדרות עיצוב</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Scrollable Content Area - No horizontal scroll */}
        <div className="overflow-y-auto overflow-x-hidden scrollbar-hide rounded-b-3xl" style={{
        height: popoverSize.height - 200,
        maxWidth: '100%'
      }} dir="rtl">
          <div className="p-5 space-y-5 max-w-full overflow-hidden">
            {/* Client Selection Only - Timer display is in header */}
            <TimerWidget showTimerDisplay={false} />
            
            {/* Elegant Divider */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center px-4">
                <div className="w-full border-t-2" style={{
                borderColor: `${timerTheme.borderColor}4D`
              }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-5 font-semibold flex items-center gap-2" style={{
                backgroundColor: timerTheme.backgroundColor,
                color: timerTheme.labelsColor || timerTheme.accentColor,
                fontSize: `${timerTheme.labelsFontSize || 12}px`
              }}>
                  <Clock className="h-3.5 w-3.5" />
                  רישומי זמן היום
                </span>
              </div>
            </div>
            
            {/* Time Entries List */}
            <TimeEntriesList />
          </div>
        </div>
      </PopoverContent>
      
      {/* Timer Settings Dialog */}
      <TimerSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} theme={timerTheme} onThemeChange={setTimerTheme} />
    </Popover>;
}

// Wrapper component that provides the theme context
export function FloatingTimer() {
  return <TimerThemeProvider>
      <FloatingTimerContent />
    </TimerThemeProvider>;
}