// Unified Dev Tools - כלי פיתוח מאוחדים
// כל כפתור צף בנפרד, ניתן להזזה עצמאית, עיצוב לבן עם זהב
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Bug,
  Zap,
  Database,
  Trash2,
  X,
  Copy,
  AlertCircle,
  AlertTriangle,
  Info,
  Gauge,
  GitPullRequest,
  Upload,
  RefreshCw,
  Eye,
  Settings,
  Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEV_MODE_KEY = 'dev-tools-enabled';
const DEV_BUTTONS_POSITIONS_KEY = 'dev-buttons-positions';
const DEV_BUTTONS_CONFIG_KEY = 'dev-buttons-config';
const DEV_TOOLS_MINIMIZED_KEY = 'dev-tools-minimized';

interface Position {
  x: number;
  y: number;
}

interface LogEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

interface ButtonConfig {
  id: string;
  enabled: boolean;
  position: Position;
}

interface DevButtonProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  initialPosition: Position;
  onClick: () => void;
  isActive?: boolean;
  onPositionChange: (id: string, pos: Position) => void;
}

// כפתור צף בודד - ניתן להזזה עצמאית
function DraggableDevButton({ 
  id, 
  icon, 
  label, 
  color, 
  initialPosition, 
  onClick, 
  isActive,
  onPositionChange 
}: DevButtonProps) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      
      const boundedPos = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      };
      
      setPosition(boundedPos);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(id, position);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, onPositionChange, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    // Right click or ctrl+click for drag
    if (e.button === 2 || e.ctrlKey) {
      e.preventDefault();
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      title={`${label} (Ctrl+גרור להזזה)`}
      className={cn(
        'fixed z-[99999] w-12 h-12 rounded-full shadow-lg',
        'flex items-center justify-center',
        'border-2 transition-all duration-200',
        'hover:scale-110 active:scale-95',
        isDragging && 'cursor-grabbing scale-110 shadow-xl',
        !isDragging && 'cursor-pointer',
        isActive 
          ? 'bg-[#D4A843] border-[#D4A843] text-white shadow-[0_0_20px_rgba(212,168,67,0.5)]' 
          : 'bg-white border-[#D4A843]/50 text-[#D4A843] hover:border-[#D4A843] hover:shadow-[0_0_15px_rgba(212,168,67,0.3)]'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {icon}
    </button>
  );
}

// חלון קונסול צף
function ConsoleWindow({ 
  isOpen, 
  onClose, 
  logs, 
  onClear 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  logs: LogEntry[];
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 500)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 400)),
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Terminal className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
    }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <Card
      className="fixed z-[100000] bg-white border-2 border-[#D4A843] shadow-2xl w-[500px] h-[400px] flex flex-col"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className={cn(
          'flex items-center justify-between p-3 border-b border-[#D4A843]/30',
          'bg-gradient-to-r from-white to-gray-50 cursor-grab',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={(e) => {
          setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
          setIsDragging(true);
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-[#D4A843]" />
          <span className="font-semibold text-[#1e3a5f]">קונסול</span>
          <Badge className="bg-[#D4A843] text-white">{logs.length}</Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} title="נקה">
            <Trash2 className="h-4 w-4 text-[#D4A843]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
            const text = logs.map(l => `[${formatTime(l.timestamp)}] ${l.type}: ${l.message}`).join('\n');
            navigator.clipboard.writeText(text);
            toast.success('הועתק');
          }} title="העתק">
            <Copy className="h-4 w-4 text-[#D4A843]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-100" onClick={onClose} title="סגור (ESC)">
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Terminal className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>אין לוגים עדיין</p>
            </div>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={cn(
                'flex gap-2 p-2 rounded border-r-4 hover:bg-white/50 transition-colors',
                log.type === 'error' && 'bg-red-50 border-red-500',
                log.type === 'warn' && 'bg-yellow-50 border-yellow-500',
                log.type === 'info' && 'bg-blue-50 border-blue-500',
                log.type === 'log' && 'bg-white border-gray-300'
              )}
            >
              <div className="flex-shrink-0">{getLogIcon(log.type)}</div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500">{formatTime(log.timestamp)}</span>
                <pre className="whitespace-pre-wrap break-words text-xs mt-1">{log.message}</pre>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[#D4A843]/30 bg-white text-center">
        <p className="text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">ESC</kbd> לסגירה
        </p>
      </div>
    </Card>
  );
}

// חלון ביצועים צף
function PerformanceWindow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0,
    domNodes: 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateMetrics = () => {
      // FPS calculation
      let lastTime = performance.now();
      let frames = 0;
      
      const countFrame = () => {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          setMetrics(prev => ({ ...prev, fps: frames }));
          frames = 0;
          lastTime = now;
        }
        if (isOpen) requestAnimationFrame(countFrame);
      };
      requestAnimationFrame(countFrame);

      // Memory (if available)
      if ((performance as unknown as { memory?: { usedJSHeapSize: number } }).memory) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        setMetrics(prev => ({ 
          ...prev, 
          memory: Math.round(memory.usedJSHeapSize / 1024 / 1024) 
        }));
      }

      // DOM nodes
      setMetrics(prev => ({ 
        ...prev, 
        domNodes: document.querySelectorAll('*').length,
        loadTime: Math.round(performance.now())
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: Math.max(0, e.clientX - dragOffset.x),
        y: Math.max(0, e.clientY - dragOffset.y),
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <Card
      className="fixed z-[100000] bg-white border-2 border-[#D4A843] shadow-2xl w-[300px] flex flex-col"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        className="flex items-center justify-between p-3 border-b border-[#D4A843]/30 bg-gradient-to-r from-white to-gray-50 cursor-grab"
        onMouseDown={(e) => {
          setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
          setIsDragging(true);
        }}
      >
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-[#D4A843]" />
          <span className="font-semibold text-[#1e3a5f]">ביצועים</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-100" onClick={onClose}>
          <X className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">FPS</span>
          <Badge className={cn(
            metrics.fps >= 55 ? 'bg-green-500' : metrics.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
          )}>{metrics.fps}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">זיכרון</span>
          <Badge variant="outline">{metrics.memory} MB</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">אלמנטים DOM</span>
          <Badge variant="outline">{metrics.domNodes}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">זמן טעינה</span>
          <Badge variant="outline">{metrics.loadTime}ms</Badge>
        </div>
      </div>
    </Card>
  );
}

// חלון Inspector צף
function InspectorWindow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedElement, setSelectedElement] = useState<{
    tagName: string;
    id: string;
    className: string;
    dimensions: string;
  } | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (highlightRef.current) {
        highlightRef.current.remove();
        highlightRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('[data-dev-tool]')) return;

      // Create or update highlight
      if (!highlightRef.current) {
        highlightRef.current = document.createElement('div');
        highlightRef.current.setAttribute('data-dev-tool', 'true');
        highlightRef.current.style.cssText = `
          position: fixed;
          pointer-events: none;
          border: 2px solid #D4A843;
          background: rgba(212, 168, 67, 0.1);
          z-index: 99998;
          transition: all 0.1s ease;
        `;
        document.body.appendChild(highlightRef.current);
      }

      const rect = target.getBoundingClientRect();
      highlightRef.current.style.left = `${rect.left}px`;
      highlightRef.current.style.top = `${rect.top}px`;
      highlightRef.current.style.width = `${rect.width}px`;
      highlightRef.current.style.height = `${rect.height}px`;
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('[data-dev-tool]')) return;
      
      e.preventDefault();
      e.stopPropagation();

      const rect = target.getBoundingClientRect();
      setSelectedElement({
        tagName: target.tagName.toLowerCase(),
        id: target.id || '(ללא)',
        className: target.className || '(ללא)',
        dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      if (highlightRef.current) {
        highlightRef.current.remove();
        highlightRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Indicator */}
      <div 
        data-dev-tool="true"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100001] bg-[#1e3a5f] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
      >
        <Bug className="h-4 w-4 text-[#D4A843]" />
        <span className="text-sm">מצב בדיקה פעיל - לחץ על אלמנט</span>
        <Button size="sm" variant="ghost" className="h-6 px-2 hover:bg-white/20" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Info Card */}
      {selectedElement && (
        <Card data-dev-tool="true" className="fixed bottom-4 right-4 z-[100001] bg-white border-2 border-[#D4A843] shadow-xl p-4 w-[280px]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-[#1e3a5f]">פרטי אלמנט</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedElement(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">תגית:</span>
              <code className="bg-gray-100 px-2 rounded">{selectedElement.tagName}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <code className="bg-gray-100 px-2 rounded text-xs">{selectedElement.id}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">גודל:</span>
              <code className="bg-gray-100 px-2 rounded">{selectedElement.dimensions}</code>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

// הקומפוננטה הראשית
export function UnifiedDevTools() {
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem(DEV_MODE_KEY) === 'true';
  });

  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem(DEV_TOOLS_MINIMIZED_KEY) === 'true';
  });

  // States for windows
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Button positions
  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    try {
      const saved = localStorage.getItem(DEV_BUTTONS_POSITIONS_KEY);
      return saved ? JSON.parse(saved) : {
        console: { x: 20, y: 100 },
        inspector: { x: 20, y: 160 },
        performance: { x: 20, y: 220 },
        database: { x: 20, y: 280 },
        clear: { x: 20, y: 340 },
        refresh: { x: 20, y: 400 },
      };
    } catch {
      return {
        console: { x: 20, y: 100 },
        inspector: { x: 20, y: 160 },
        performance: { x: 20, y: 220 },
        database: { x: 20, y: 280 },
        clear: { x: 20, y: 340 },
        refresh: { x: 20, y: 400 },
      };
    }
  });

  // Button config (enabled/disabled)
  const [buttonConfig, setButtonConfig] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(DEV_BUTTONS_CONFIG_KEY);
      return saved ? JSON.parse(saved) : {
        console: true,
        inspector: true,
        performance: true,
        database: true,
        clear: true,
        refresh: true,
      };
    } catch {
      return {
        console: true,
        inspector: true,
        performance: true,
        database: true,
        clear: true,
        refresh: true,
      };
    }
  });

  const originalConsole = useRef<Record<string, (...args: unknown[]) => void>>({});

  // Listen for dev mode changes
  useEffect(() => {
    const handleDevModeChange = (e: CustomEvent) => {
      setIsEnabled(e.detail.enabled);
    };
    window.addEventListener('devModeChanged', handleDevModeChange as EventListener);
    return () => window.removeEventListener('devModeChanged', handleDevModeChange as EventListener);
  }, []);

  // Save positions
  const handlePositionChange = useCallback((id: string, pos: Position) => {
    setPositions(prev => {
      const updated = { ...prev, [id]: pos };
      localStorage.setItem(DEV_BUTTONS_POSITIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Intercept console when console window is open
  useEffect(() => {
    if (!consoleOpen) return;

    originalConsole.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const addLog = (type: 'log' | 'warn' | 'error' | 'info', args: unknown[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); } 
          catch { return String(arg); }
        }
        return String(arg);
      }).join(' ');

      setLogs(prev => [...prev.slice(-500), {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: new Date(),
      }]);
    };

    console.log = (...args: unknown[]) => {
      originalConsole.current.log?.(...args);
      addLog('log', args);
    };
    console.warn = (...args: unknown[]) => {
      originalConsole.current.warn?.(...args);
      addLog('warn', args);
    };
    console.error = (...args: unknown[]) => {
      originalConsole.current.error?.(...args);
      addLog('error', args);
    };
    console.info = (...args: unknown[]) => {
      originalConsole.current.info?.(...args);
      addLog('info', args);
    };

    return () => {
      if (originalConsole.current.log) {
        console.log = originalConsole.current.log;
        console.warn = originalConsole.current.warn;
        console.error = originalConsole.current.error;
        console.info = originalConsole.current.info;
      }
    };
  }, [consoleOpen]);

  if (!isEnabled) return null;

  const handleClose = () => {
    setIsEnabled(false);
    localStorage.setItem(DEV_MODE_KEY, 'false');
    window.dispatchEvent(new CustomEvent('devModeChanged', { detail: { enabled: false } }));
    toast.success('כלי פיתוח נסגרו');
  };

  const handleToggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    localStorage.setItem(DEV_TOOLS_MINIMIZED_KEY, String(newMinimized));
    toast.info(newMinimized ? 'כלי פיתוח מוזערו' : 'כלי פיתוח הורחבו');
  };

  const buttons = [
    {
      id: 'console',
      icon: <Terminal className="h-5 w-5" />,
      label: 'קונסול',
      color: '#D4A843',
      onClick: () => setConsoleOpen(true),
      isActive: consoleOpen,
    },
    {
      id: 'inspector',
      icon: <Bug className="h-5 w-5" />,
      label: 'בודק אלמנטים',
      color: '#D4A843',
      onClick: () => setInspectorOpen(!inspectorOpen),
      isActive: inspectorOpen,
    },
    {
      id: 'performance',
      icon: <Gauge className="h-5 w-5" />,
      label: 'ביצועים',
      color: '#D4A843',
      onClick: () => setPerformanceOpen(true),
      isActive: performanceOpen,
    },
    {
      id: 'database',
      icon: <Database className="h-5 w-5" />,
      label: 'מסד נתונים',
      color: '#D4A843',
      onClick: () => {
        toast.info('מסד נתונים - בפיתוח');
      },
      isActive: false,
    },
    {
      id: 'clear',
      icon: <Trash2 className="h-5 w-5" />,
      label: 'נקה Cache',
      color: '#D4A843',
      onClick: () => {
        localStorage.clear();
        sessionStorage.clear();
        toast.success('Cache נוקה');
        // Restore dev mode
        localStorage.setItem(DEV_MODE_KEY, 'true');
      },
      isActive: false,
    },
    {
      id: 'refresh',
      icon: <RefreshCw className="h-5 w-5" />,
      label: 'רענן דף',
      color: '#D4A843',
      onClick: () => window.location.reload(),
      isActive: false,
    },
  ];

  return (
    <>
      {/* Control Panel - Always visible */}
      <div className="fixed bottom-4 right-4 z-[99998] flex flex-col gap-2">
        <Button
          onClick={handleToggleMinimize}
          size="icon"
          title={isMinimized ? 'הרחב כלי פיתוח' : 'מזער כלי פיתוח'}
          className={cn(
            'h-10 w-10 rounded-full shadow-lg border-2',
            'bg-white border-[#D4A843] text-[#D4A843]',
            'hover:bg-[#D4A843] hover:text-white transition-all'
          )}
        >
          <Eye className={cn('h-5 w-5', isMinimized && 'opacity-50')} />
        </Button>
        <Button
          onClick={handleClose}
          size="icon"
          variant="destructive"
          title="סגור כלי פיתוח"
          className="h-10 w-10 rounded-full shadow-lg"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Floating Buttons - Hidden when minimized */}
      {!isMinimized && buttons.filter(btn => buttonConfig[btn.id] !== false).map(btn => (
        <DraggableDevButton
          key={btn.id}
          id={btn.id}
          icon={btn.icon}
          label={btn.label}
          color={btn.color}
          initialPosition={positions[btn.id] || { x: 20, y: 100 }}
          onClick={btn.onClick}
          isActive={btn.isActive}
          onPositionChange={handlePositionChange}
        />
      ))}

      {/* Windows */}
      <ConsoleWindow 
        isOpen={consoleOpen} 
        onClose={() => setConsoleOpen(false)} 
        logs={logs}
        onClear={() => setLogs([])}
      />
      <PerformanceWindow 
        isOpen={performanceOpen} 
        onClose={() => setPerformanceOpen(false)} 
      />
      <InspectorWindow 
        isOpen={inspectorOpen} 
        onClose={() => setInspectorOpen(false)} 
      />
    </>
  );
}
