// Performance Analyzer - e-control CRM Pro
// כלי לבדיקת ביצועים, השוואה והמלצות
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Gauge,
  Zap,
  Clock,
  HardDrive,
  Network,
  Image as ImageIcon,
  Code2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  RotateCcw,
  Download,
  History,
  Lightbulb,
  BarChart3,
  Cpu,
  MemoryStick,
  Wifi,
  FileCode,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Performance Test Result Interface
interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  
  // Additional Metrics
  domContentLoaded: number;
  loadComplete: number;
  domNodes: number;
  jsHeapSize: number;
  jsHeapLimit: number;
  resourceCount: number;
  totalTransferSize: number;
  
  // Component Metrics
  componentRenderTime: number;
  rerenderCount: number;
  
  // Network Metrics
  connectionType?: string;
  downlink?: number;
  rtt?: number;
}

interface TestResult {
  id: string;
  timestamp: Date;
  url: string;
  metrics: PerformanceMetrics;
  score: number;
  recommendations: Recommendation[];
}

interface Recommendation {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  howToFix?: string;
}

// Core Web Vitals Thresholds (Good / Needs Improvement / Poor)
const THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
};

const STORAGE_KEY = 'performance-test-history';

export function PerformanceAnalyzer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const startTimeRef = useRef<number>(0);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
  }, [history]);

  // Get metric score (good/warning/poor)
  const getMetricScore = useCallback((metric: keyof typeof THRESHOLDS, value: number) => {
    const threshold = THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'warning';
    return 'poor';
  }, []);

  // Calculate overall score
  const calculateScore = useCallback((metrics: PerformanceMetrics): number => {
    let score = 100;
    
    // FCP (25%)
    if (metrics.fcp > THRESHOLDS.fcp.poor) score -= 25;
    else if (metrics.fcp > THRESHOLDS.fcp.good) score -= 12;
    
    // LCP (25%)
    if (metrics.lcp > THRESHOLDS.lcp.poor) score -= 25;
    else if (metrics.lcp > THRESHOLDS.lcp.good) score -= 12;
    
    // FID (15%)
    if (metrics.fid > THRESHOLDS.fid.poor) score -= 15;
    else if (metrics.fid > THRESHOLDS.fid.good) score -= 7;
    
    // CLS (15%)
    if (metrics.cls > THRESHOLDS.cls.poor) score -= 15;
    else if (metrics.cls > THRESHOLDS.cls.good) score -= 7;
    
    // TTFB (10%)
    if (metrics.ttfb > THRESHOLDS.ttfb.poor) score -= 10;
    else if (metrics.ttfb > THRESHOLDS.ttfb.good) score -= 5;
    
    // DOM Nodes penalty
    if (metrics.domNodes > 1500) score -= 5;
    if (metrics.domNodes > 3000) score -= 5;
    
    // Memory penalty
    const memoryUsage = (metrics.jsHeapSize / metrics.jsHeapLimit) * 100;
    if (memoryUsage > 80) score -= 5;
    if (memoryUsage > 90) score -= 5;
    
    return Math.max(0, Math.round(score));
  }, []);

  // Generate recommendations
  const generateRecommendations = useCallback((metrics: PerformanceMetrics): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // FCP Recommendations
    if (metrics.fcp > THRESHOLDS.fcp.good) {
      recommendations.push({
        id: 'fcp-slow',
        type: metrics.fcp > THRESHOLDS.fcp.poor ? 'critical' : 'warning',
        category: 'First Contentful Paint',
        title: 'FCP איטי - תוכן ראשוני לוקח זמן להופיע',
        description: `הזמן להצגת התוכן הראשון הוא ${metrics.fcp.toFixed(0)}ms (המטרה: מתחת ל-${THRESHOLDS.fcp.good}ms)`,
        impact: 'high',
        howToFix: 'הסר משאבים חוסמי-עיבוד, השתמש ב-font-display: swap, טען CSS קריטי inline',
      });
    }
    
    // LCP Recommendations
    if (metrics.lcp > THRESHOLDS.lcp.good) {
      recommendations.push({
        id: 'lcp-slow',
        type: metrics.lcp > THRESHOLDS.lcp.poor ? 'critical' : 'warning',
        category: 'Largest Contentful Paint',
        title: 'LCP איטי - האלמנט הגדול ביותר לוקח זמן לטעון',
        description: `הזמן להצגת האלמנט הגדול הוא ${metrics.lcp.toFixed(0)}ms (המטרה: מתחת ל-${THRESHOLDS.lcp.good}ms)`,
        impact: 'high',
        howToFix: 'אופטם תמונות, השתמש ב-preload לתמונות גדולות, השתמש ב-CDN',
      });
    }
    
    // CLS Recommendations
    if (metrics.cls > THRESHOLDS.cls.good) {
      recommendations.push({
        id: 'cls-high',
        type: metrics.cls > THRESHOLDS.cls.poor ? 'critical' : 'warning',
        category: 'Cumulative Layout Shift',
        title: 'CLS גבוה - יש הזזות לא צפויות בדף',
        description: `ציון CLS הוא ${metrics.cls.toFixed(3)} (המטרה: מתחת ל-${THRESHOLDS.cls.good})`,
        impact: 'medium',
        howToFix: 'הגדר מידות לתמונות ווידאו, הימנע מתוכן דינמי מעל תוכן קיים, השתמש ב-transform במקום שינוי position',
      });
    }
    
    // TTFB Recommendations
    if (metrics.ttfb > THRESHOLDS.ttfb.good) {
      recommendations.push({
        id: 'ttfb-slow',
        type: metrics.ttfb > THRESHOLDS.ttfb.poor ? 'critical' : 'warning',
        category: 'Time to First Byte',
        title: 'TTFB איטי - השרת מגיב לאט',
        description: `זמן תגובת השרת הוא ${metrics.ttfb.toFixed(0)}ms (המטרה: מתחת ל-${THRESHOLDS.ttfb.good}ms)`,
        impact: 'high',
        howToFix: 'השתמש ב-CDN, אופטם את השרת, הפעל caching',
      });
    }
    
    // DOM Nodes
    if (metrics.domNodes > 1500) {
      recommendations.push({
        id: 'dom-large',
        type: metrics.domNodes > 3000 ? 'critical' : 'warning',
        category: 'גודל DOM',
        title: 'עץ DOM גדול מדי',
        description: `יש ${metrics.domNodes.toLocaleString()} אלמנטים ב-DOM (מומלץ: מתחת ל-1500)`,
        impact: 'medium',
        howToFix: 'השתמש ב-virtualization לרשימות ארוכות, הסר אלמנטים מיותרים, פשט את מבנה ה-HTML',
      });
    }
    
    // Memory Usage
    const memoryUsage = (metrics.jsHeapSize / metrics.jsHeapLimit) * 100;
    if (memoryUsage > 70) {
      recommendations.push({
        id: 'memory-high',
        type: memoryUsage > 85 ? 'critical' : 'warning',
        category: 'שימוש בזיכרון',
        title: 'שימוש גבוה בזיכרון',
        description: `השימוש בזיכרון הוא ${memoryUsage.toFixed(1)}% (${(metrics.jsHeapSize / 1024 / 1024).toFixed(1)}MB מתוך ${(metrics.jsHeapLimit / 1024 / 1024).toFixed(1)}MB)`,
        impact: 'medium',
        howToFix: 'בדוק memory leaks, נקה event listeners, השתמש ב-useMemo/useCallback',
      });
    }
    
    // Resource Count
    if (metrics.resourceCount > 100) {
      recommendations.push({
        id: 'resources-many',
        type: 'warning',
        category: 'מספר משאבים',
        title: 'יותר מדי בקשות HTTP',
        description: `נטענו ${metrics.resourceCount} משאבים (מומלץ: מתחת ל-100)`,
        impact: 'medium',
        howToFix: 'אחד קבצי CSS/JS, השתמש ב-code splitting, השתמש בתמונות sprites',
      });
    }
    
    // Transfer Size
    const transferMB = metrics.totalTransferSize / 1024 / 1024;
    if (transferMB > 3) {
      recommendations.push({
        id: 'transfer-large',
        type: transferMB > 5 ? 'critical' : 'warning',
        category: 'גודל העברה',
        title: 'גודל עמוד גדול מדי',
        description: `גודל כולל: ${transferMB.toFixed(2)}MB (מומלץ: מתחת ל-3MB)`,
        impact: 'high',
        howToFix: 'דחוס תמונות, השתמש ב-lazy loading, מזער CSS/JS',
      });
    }
    
    // Good performance messages
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'all-good',
        type: 'info',
        category: 'כללי',
        title: '🎉 ביצועים מעולים!',
        description: 'כל המדדים בטווח הירוק. המשך לשמור על הביצועים הטובים.',
        impact: 'low',
      });
    }
    
    return recommendations;
  }, []);

  // Run performance test - ENHANCED VERSION
  const runTest = useCallback(async () => {
    setIsRunning(true);
    startTimeRef.current = performance.now();
    
    // Log to console for developers
    console.group('⚡ בדיקת ביצועים מתחילה...');
    console.time('Performance Test Duration');
    
    try {
      // Wait a bit to ensure page is fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Log raw data
      console.log('📊 נתוני ניווט גולמיים:', navigation);
      console.log('🎨 נתוני צביעה:', paintEntries);
      console.log('📦 משאבים שנטענו:', resourceEntries.length);
      
      // Get FCP with fallback
      const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
      const fpEntry = paintEntries.find(e => e.name === 'first-paint');
      const fcp = fcpEntry?.startTime || fpEntry?.startTime || navigation?.domContentLoadedEventStart || 0;
      
      // Enhanced LCP calculation
      let lcp = 0;
      try {
        // Try multiple methods for LCP
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          lcp = (lcpEntries[lcpEntries.length - 1] as any).startTime;
        } else {
          // Fallback: estimate from DOM content loaded + render time
          const renderTime = performance.now() - startTimeRef.current;
          lcp = Math.max(navigation?.domContentLoadedEventEnd || 0, fcp, renderTime);
        }
      } catch {
        lcp = navigation?.domContentLoadedEventEnd || fcp * 1.5;
      }
      
      // Enhanced FID calculation
      let fid = 0;
      try {
        const fidEntries = performance.getEntriesByType('first-input');
        if (fidEntries.length > 0) {
          const firstInput = fidEntries[0] as any;
          fid = firstInput.processingStart - firstInput.startTime;
        } else {
          // Estimate FID from event loop delay
          const start = performance.now();
          await new Promise(resolve => setTimeout(resolve, 0));
          fid = Math.max(0, performance.now() - start - 1);
        }
      } catch {
        fid = 0;
      }
      
      // Enhanced CLS calculation
      let cls = 0;
      try {
        const layoutShiftEntries = performance.getEntriesByType('layout-shift');
        cls = layoutShiftEntries.reduce((sum, entry: any) => sum + (entry.value || 0), 0);
      } catch {
        cls = 0;
      }
      
      // Get memory info - Enhanced
      let jsHeapSize = 0;
      let jsHeapLimit = 1;
      try {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          jsHeapSize = memoryInfo.usedJSHeapSize;
          jsHeapLimit = memoryInfo.jsHeapSizeLimit;
          console.log('💾 זיכרון:', {
            used: (jsHeapSize / 1024 / 1024).toFixed(2) + 'MB',
            total: (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
            limit: (jsHeapLimit / 1024 / 1024).toFixed(2) + 'MB',
            usagePercent: ((jsHeapSize / jsHeapLimit) * 100).toFixed(1) + '%'
          });
        }
      } catch {
        console.warn('⚠️ Memory API לא זמין');
      }
      
      // Get network info - Enhanced
      let connectionType = 'unknown';
      let downlink = 0;
      let rtt = 0;
      try {
        const connection = (navigator as any).connection;
        if (connection) {
          connectionType = connection.effectiveType || 'unknown';
          downlink = connection.downlink || 0;
          rtt = connection.rtt || 0;
          console.log('🌐 חיבור רשת:', {
            type: connectionType,
            speed: downlink + ' Mbps',
            latency: rtt + 'ms',
            saveData: connection.saveData ? 'כן' : 'לא'
          });
        }
      } catch {
        console.warn('⚠️ Network API לא זמין');
      }
      
      // Calculate total transfer size with details
      const totalTransferSize = resourceEntries.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      
      // Analyze resources by type
      const resourcesByType: Record<string, { count: number; size: number }> = {};
      resourceEntries.forEach(r => {
        const type = r.initiatorType || 'other';
        if (!resourcesByType[type]) resourcesByType[type] = { count: 0, size: 0 };
        resourcesByType[type].count++;
        resourcesByType[type].size += r.transferSize || 0;
      });
      console.log('📦 משאבים לפי סוג:', resourcesByType);
      
      // DOM Analysis
      const domNodes = document.querySelectorAll('*').length;
      console.log('🏗️ ניתוח DOM:', {
        totalElements: domNodes,
        tables: document.querySelectorAll('table').length,
        images: document.querySelectorAll('img').length,
        scripts: document.querySelectorAll('script').length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      });
      
      const metrics: PerformanceMetrics = {
        fcp,
        lcp,
        fid,
        cls,
        ttfb: Math.max(0, (navigation?.responseStart || 0) - (navigation?.requestStart || 0)),
        domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
        loadComplete: navigation?.loadEventEnd || 0,
        domNodes,
        jsHeapSize,
        jsHeapLimit: jsHeapLimit || 1,
        resourceCount: resourceEntries.length,
        totalTransferSize,
        componentRenderTime: performance.now() - startTimeRef.current,
        rerenderCount: 0,
        connectionType,
        downlink,
        rtt,
      };
      
      // Log final metrics summary
      console.log('📈 סיכום מדדי ביצועים:', {
        'FCP (First Contentful Paint)': metrics.fcp.toFixed(0) + 'ms',
        'LCP (Largest Contentful Paint)': metrics.lcp.toFixed(0) + 'ms',
        'FID (First Input Delay)': metrics.fid.toFixed(0) + 'ms',
        'CLS (Cumulative Layout Shift)': metrics.cls.toFixed(3),
        'TTFB (Time to First Byte)': metrics.ttfb.toFixed(0) + 'ms',
        'DOM Content Loaded': metrics.domContentLoaded.toFixed(0) + 'ms',
        'Full Load': metrics.loadComplete.toFixed(0) + 'ms',
      });
      
      const recommendations = generateRecommendations(metrics);
      const score = calculateScore(metrics);
      
      console.log('🏆 ציון ביצועים:', score + '/100');
      console.log('💡 המלצות:', recommendations.length);
      console.timeEnd('Performance Test Duration');
      console.groupEnd();
      
      const result: TestResult = {
        id: `test-${Date.now()}`,
        timestamp: new Date(),
        url: window.location.href,
        metrics,
        score,
        recommendations,
      };
      
      setCurrentResult(result);
      setHistory(prev => [...prev, result]);
      
    } catch (error) {
      console.error('[PerformanceAnalyzer] Test failed:', error);
      console.groupEnd();
    } finally {
      setIsRunning(false);
    }
  }, [calculateScore, generateRecommendations]);

  // Get comparison data
  const getComparison = useCallback(() => {
    if (!currentResult || !selectedComparison) return null;
    const compared = history.find(h => h.id === selectedComparison);
    if (!compared) return null;
    
    return {
      current: currentResult,
      previous: compared,
      diff: {
        score: currentResult.score - compared.score,
        fcp: currentResult.metrics.fcp - compared.metrics.fcp,
        lcp: currentResult.metrics.lcp - compared.metrics.lcp,
        cls: currentResult.metrics.cls - compared.metrics.cls,
        ttfb: currentResult.metrics.ttfb - compared.metrics.ttfb,
      },
    };
  }, [currentResult, selectedComparison, history]);

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/30';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  // Metric color
  const getMetricColor = (metric: keyof typeof THRESHOLDS, value: number) => {
    const status = getMetricScore(metric, value);
    if (status === 'good') return 'text-green-500';
    if (status === 'warning') return 'text-yellow-500';
    return 'text-red-500';
  };

  // Export report
  const exportReport = useCallback(() => {
    if (!currentResult) return;
    
    const report = {
      generatedAt: new Date().toISOString(),
      url: currentResult.url,
      score: currentResult.score,
      metrics: currentResult.metrics,
      recommendations: currentResult.recommendations,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentResult]);

  const comparison = getComparison();
  
  // Gold styling
  const goldIcon = "text-yellow-500";
  const goldBorder = "border border-yellow-500/30";

  return (
    <>
      {/* Trigger Button - Gold Design */}
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "h-9 w-9 p-0 rounded-lg",
          goldBorder,
          isOpen ? "bg-yellow-500/20" : "hover:bg-yellow-500/10",
          goldIcon
        )}
        onClick={() => setIsOpen(true)}
        title="בדיקת ביצועים"
      >
        <Gauge className="h-4 w-4" />
      </Button>

      {/* Performance Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-slate-900 border-slate-700 overflow-hidden" dir="rtl">
          <DialogHeader className="px-6 py-4 border-b border-slate-700">
            <DialogTitle className="text-lg text-white flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-400" />
              בדיקת ביצועים ואופטימיזציה
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[70vh]">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={runTest}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRunning ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      בודק...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      הרץ בדיקה
                    </>
                  )}
                </Button>
                
                {currentResult && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportReport}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ייצא דוח
                  </Button>
                )}
              </div>
              
              {/* Comparison Selector */}
              {history.length > 1 && currentResult && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">השווה ל:</span>
                  <select
                    value={selectedComparison || ''}
                    onChange={(e) => setSelectedComparison(e.target.value || null)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-gray-300"
                    title="בחר בדיקת ביצועים להשוואה"
                    aria-label="בחר בדיקת ביצועים להשוואה"
                  >
                    <option value="">בחר בדיקה</option>
                    {history
                      .filter(h => h.id !== currentResult.id)
                      .map(h => (
                        <option key={h.id} value={h.id}>
                          {new Date(h.timestamp).toLocaleString('he-IL')} - {h.score}%
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              {!currentResult && !isRunning ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Gauge className="h-16 w-16 text-slate-600 mb-4" />
                  <h3 className="text-xl text-gray-300 mb-2">בדיקת ביצועים</h3>
                  <p className="text-gray-500 mb-4 max-w-md">
                    הרץ בדיקה כדי לקבל ניתוח מעמיק של ביצועי האתר, כולל Core Web Vitals, 
                    ניצול זיכרון, והמלצות לשיפור.
                  </p>
                  <Button
                    onClick={runTest}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    התחל בדיקה
                  </Button>
                </div>
              ) : isRunning ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="relative mb-4">
                    <Gauge className="h-16 w-16 text-blue-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-20 w-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-xl text-gray-300 mb-2">מריץ בדיקות...</h3>
                  <p className="text-gray-500">אוסף נתוני ביצועים ומנתח תוצאות</p>
                </div>
              ) : currentResult && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full bg-slate-800 rounded-none border-b border-slate-700 p-1 gap-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      סקירה
                    </TabsTrigger>
                    <TabsTrigger value="vitals" className="data-[state=active]:bg-slate-700">
                      <Zap className="h-4 w-4 mr-1" />
                      Core Web Vitals
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="data-[state=active]:bg-slate-700">
                      <Package className="h-4 w-4 mr-1" />
                      משאבים
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="data-[state=active]:bg-slate-700">
                      <Lightbulb className="h-4 w-4 mr-1" />
                      המלצות
                      {currentResult.recommendations.filter(r => r.type !== 'info').length > 0 && (
                        <Badge className="ml-1 bg-yellow-500/20 text-yellow-400 px-1.5">
                          {currentResult.recommendations.filter(r => r.type !== 'info').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-slate-700">
                      <History className="h-4 w-4 mr-1" />
                      היסטוריה
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="p-6 space-y-6">
                    {/* Score Card */}
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "flex flex-col items-center justify-center w-32 h-32 rounded-full border-4",
                        getScoreBg(currentResult.score)
                      )}>
                        <span className={cn("text-4xl font-bold", getScoreColor(currentResult.score))}>
                          {currentResult.score}
                        </span>
                        <span className="text-xs text-gray-400">מתוך 100</span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg text-white">ציון כללי</h3>
                        <p className="text-gray-400 text-sm">
                          {currentResult.score >= 90 && 'ביצועים מעולים! האתר מהיר ומותאם היטב.'}
                          {currentResult.score >= 50 && currentResult.score < 90 && 'ביצועים סבירים, יש מקום לשיפור.'}
                          {currentResult.score < 50 && 'ביצועים חלשים, נדרשים שיפורים משמעותיים.'}
                        </p>
                        
                        {/* Comparison */}
                        {comparison && (
                          <div className="flex items-center gap-2 mt-2">
                            {comparison.diff.score > 0 ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{comparison.diff.score}
                              </Badge>
                            ) : comparison.diff.score < 0 ? (
                              <Badge className="bg-red-500/20 text-red-400">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {comparison.diff.score}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500/20 text-gray-400">
                                <Minus className="h-3 w-3 mr-1" />
                                ללא שינוי
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              בהשוואה לבדיקה קודמת
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">זמן טעינה</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {(currentResult.metrics.loadComplete / 1000).toFixed(2)}s
                        </div>
                      </div>
                      
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <MemoryStick className="h-4 w-4" />
                          <span className="text-xs">זיכרון</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {(currentResult.metrics.jsHeapSize / 1024 / 1024).toFixed(0)}MB
                        </div>
                      </div>
                      
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Code2 className="h-4 w-4" />
                          <span className="text-xs">אלמנטי DOM</span>
                        </div>
                        <div className={cn(
                          "text-2xl font-bold",
                          currentResult.metrics.domNodes > 1500 ? "text-yellow-500" : "text-white"
                        )}>
                          {currentResult.metrics.domNodes.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Network className="h-4 w-4" />
                          <span className="text-xs">משאבים</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {currentResult.metrics.resourceCount}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Core Web Vitals Tab */}
                  <TabsContent value="vitals" className="p-6 space-y-4">
                    <h3 className="text-lg text-white mb-4">Core Web Vitals</h3>
                    
                    {/* FCP */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-400" />
                          <span className="text-white">First Contentful Paint (FCP)</span>
                        </div>
                        <span className={cn("font-bold", getMetricColor('fcp', currentResult.metrics.fcp))}>
                          {currentResult.metrics.fcp.toFixed(0)}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (THRESHOLDS.fcp.poor - currentResult.metrics.fcp) / THRESHOLDS.fcp.poor * 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        הזמן עד להצגת התוכן הראשון על המסך
                      </p>
                    </div>
                    
                    {/* LCP */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-purple-400" />
                          <span className="text-white">Largest Contentful Paint (LCP)</span>
                        </div>
                        <span className={cn("font-bold", getMetricColor('lcp', currentResult.metrics.lcp))}>
                          {currentResult.metrics.lcp.toFixed(0)}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (THRESHOLDS.lcp.poor - currentResult.metrics.lcp) / THRESHOLDS.lcp.poor * 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        הזמן עד להצגת האלמנט הגדול ביותר
                      </p>
                    </div>
                    
                    {/* FID */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-green-400" />
                          <span className="text-white">First Input Delay (FID)</span>
                        </div>
                        <span className={cn("font-bold", getMetricColor('fid', currentResult.metrics.fid))}>
                          {currentResult.metrics.fid.toFixed(0)}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (THRESHOLDS.fid.poor - currentResult.metrics.fid) / THRESHOLDS.fid.poor * 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        הזמן עד שהדף מגיב לאינטראקציה ראשונה
                      </p>
                    </div>
                    
                    {/* CLS */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-400" />
                          <span className="text-white">Cumulative Layout Shift (CLS)</span>
                        </div>
                        <span className={cn("font-bold", getMetricColor('cls', currentResult.metrics.cls))}>
                          {currentResult.metrics.cls.toFixed(3)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (THRESHOLDS.cls.poor - currentResult.metrics.cls) / THRESHOLDS.cls.poor * 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        מדד יציבות הפריסה - כמה האלמנטים זזים
                      </p>
                    </div>
                    
                    {/* TTFB */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-cyan-400" />
                          <span className="text-white">Time to First Byte (TTFB)</span>
                        </div>
                        <span className={cn("font-bold", getMetricColor('ttfb', currentResult.metrics.ttfb))}>
                          {currentResult.metrics.ttfb.toFixed(0)}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (THRESHOLDS.ttfb.poor - currentResult.metrics.ttfb) / THRESHOLDS.ttfb.poor * 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        זמן התגובה של השרת
                      </p>
                    </div>
                  </TabsContent>

                  {/* Resources Tab */}
                  <TabsContent value="resources" className="p-6 space-y-4">
                    <h3 className="text-lg text-white mb-4">ניתוח משאבים</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                          <HardDrive className="h-4 w-4" />
                          <span>גודל העברה כולל</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                          {(currentResult.metrics.totalTransferSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <Progress 
                          value={Math.min(100, currentResult.metrics.totalTransferSize / (5 * 1024 * 1024) * 100)} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                          <MemoryStick className="h-4 w-4" />
                          <span>שימוש בזיכרון</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                          {((currentResult.metrics.jsHeapSize / currentResult.metrics.jsHeapLimit) * 100).toFixed(1)}%
                        </div>
                        <Progress 
                          value={(currentResult.metrics.jsHeapSize / currentResult.metrics.jsHeapLimit) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-4">
                      <h4 className="text-white mb-3">פרטי רשת</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">סוג חיבור:</span>
                          <span className="text-white mr-2">{currentResult.metrics.connectionType}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">מהירות:</span>
                          <span className="text-white mr-2">{currentResult.metrics.downlink} Mbps</span>
                        </div>
                        <div>
                          <span className="text-gray-400">RTT:</span>
                          <span className="text-white mr-2">{currentResult.metrics.rtt}ms</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Recommendations Tab */}
                  <TabsContent value="recommendations" className="p-6 space-y-4">
                    <h3 className="text-lg text-white mb-4">המלצות לשיפור</h3>
                    
                    {currentResult.recommendations.map(rec => (
                      <div
                        key={rec.id}
                        className={cn(
                          "rounded-lg p-4 border",
                          rec.type === 'critical' && "bg-red-500/10 border-red-500/30",
                          rec.type === 'warning' && "bg-yellow-500/10 border-yellow-500/30",
                          rec.type === 'info' && "bg-blue-500/10 border-blue-500/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {rec.type === 'critical' && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                          {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />}
                          {rec.type === 'info' && <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-medium">{rec.title}</h4>
                              <Badge className={cn(
                                "text-[10px]",
                                rec.impact === 'high' && "bg-red-500/20 text-red-400",
                                rec.impact === 'medium' && "bg-yellow-500/20 text-yellow-400",
                                rec.impact === 'low' && "bg-gray-500/20 text-gray-400"
                              )}>
                                {rec.impact === 'high' && 'השפעה גבוהה'}
                                {rec.impact === 'medium' && 'השפעה בינונית'}
                                {rec.impact === 'low' && 'השפעה נמוכה'}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{rec.description}</p>
                            {rec.howToFix && (
                              <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-300">
                                <span className="text-blue-400">💡 איך לתקן: </span>
                                {rec.howToFix}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history" className="p-6">
                    <h3 className="text-lg text-white mb-4">היסטוריית בדיקות</h3>
                    
                    {history.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">אין היסטוריית בדיקות</p>
                    ) : (
                      <div className="space-y-2">
                        {history.slice().reverse().map((test, index) => (
                          <div
                            key={test.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg bg-slate-800",
                              test.id === currentResult?.id && "ring-2 ring-blue-500"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                getScoreBg(test.score)
                              )}>
                                <span className={cn("font-bold text-sm", getScoreColor(test.score))}>
                                  {test.score}
                                </span>
                              </div>
                              <div>
                                <div className="text-white text-sm">
                                  {new Date(test.timestamp).toLocaleString('he-IL')}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {test.recommendations.filter(r => r.type === 'critical').length} קריטיים, 
                                  {' '}{test.recommendations.filter(r => r.type === 'warning').length} אזהרות
                                </div>
                              </div>
                            </div>
                            
                            {index > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedComparison(test.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                השווה
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
