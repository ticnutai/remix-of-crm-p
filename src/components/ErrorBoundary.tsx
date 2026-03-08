/**
 * Error Boundary - תופס שגיאות React ומונע קריסת כל האפליקציה
 * חובה לכל אפליקציה בייצור!
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ERROR BOUNDARY] שגיאה נתפסה:', error);
    console.error('🚨 [ERROR BOUNDARY] מידע נוסף:', errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // שליחת הדיווח לשרת (אם יש)
    this.reportError(error, errorInfo);
    
    // קריאה ל-callback אם סופק
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // כאן אפשר לשלוח ל-Sentry, LogRocket, או שרת לוגים משלך
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorCount: this.state.errorCount
      };

      console.log('📤 [ERROR BOUNDARY] שולח דיווח שגיאה:', errorReport);
      
      // TODO: שלח ל-API
      // await fetch('/api/errors', { 
      //   method: 'POST', 
      //   body: JSON.stringify(errorReport) 
      // });
    } catch (reportError) {
      console.error('❌ [ERROR BOUNDARY] נכשל בשליחת דיווח:', reportError);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
שגיאה: ${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}

זמן: ${new Date().toISOString()}
דפדפן: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      // אם סופק fallback מותאם אישית
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorCount, copied } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <CardTitle className="text-2xl">אופס! משהו השתבש</CardTitle>
                  <CardDescription>
                    המערכת נתקלה בשגיאה בלתי צפויה
                    {errorCount > 1 && ` (שגיאה מס' ${errorCount})`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* הודעת שגיאה */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">הודעת שגיאה:</h3>
                <p className="text-red-700 font-mono text-sm">
                  {error?.message || 'שגיאה לא ידועה'}
                </p>
              </div>

              {/* מידע טכני (מתקפל) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    מידע טכני (למפתחים)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Stack Trace:</h4>
                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto max-h-48">
                        {error?.stack}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Component Stack:</h4>
                      <pre className="text-xs bg-gray-900 text-blue-400 p-3 rounded overflow-x-auto max-h-32">
                        {errorInfo?.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              {/* כפתורי פעולה */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="ml-2 h-4 w-4" />
                  נסה שוב
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="ml-2 h-4 w-4" />
                  טען מחדש את הדף
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="ml-2 h-4 w-4" />
                  חזור לדף הבית
                </Button>
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    onClick={this.copyError} 
                    variant="secondary"
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="ml-2 h-4 w-4" />
                        הועתק!
                      </>
                    ) : (
                      <>
                        <Copy className="ml-2 h-4 w-4" />
                        העתק שגיאה
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* טיפים למשתמש */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 מה אפשר לעשות?</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>נסה לרענן את הדף</li>
                  <li>בדוק את חיבור האינטרנט שלך</li>
                  <li>נקה את המטמון של הדפדפן</li>
                  <li>נסה דפדפן אחר</li>
                  <li>אם השגיאה חוזרת, פנה לתמיכה הטכנית</li>
                </ul>
              </div>

              {errorCount >= 3 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ שים לב: השגיאה מתרחשת שוב ושוב. מומלץ ליצור קשר עם התמיכה הטכנית.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
