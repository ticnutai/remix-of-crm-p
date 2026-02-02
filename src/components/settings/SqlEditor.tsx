// SQL Editor Component - עורך SQL מובנה עם Syntax Highlighting
// tenarch CRM Pro

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { tokenizeSql } from '@/utils/sqlAnalyzer';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  maxHeight?: string;
  minHeight?: string;
  placeholder?: string;
  errorLine?: number;
}

// Token colors for syntax highlighting
const tokenColors: Record<string, string> = {
  keyword: 'text-purple-400',
  string: 'text-green-400',
  comment: 'text-gray-500 italic',
  number: 'text-orange-400',
  operator: 'text-cyan-400',
  identifier: 'text-blue-300',
  default: 'text-gray-200',
};

export function SqlEditor({
  value,
  onChange,
  readOnly = false,
  maxHeight = '400px',
  minHeight = '200px',
  placeholder = '-- כתוב SQL כאן...',
  errorLine,
}: SqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);
  
  // Sync scroll between textarea and highlight
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };
  
  // Update line count
  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(Math.max(lines, 1));
  }, [value]);
  
  // Render highlighted code
  const renderHighlightedCode = () => {
    if (!value) {
      return <span className="text-gray-500">{placeholder}</span>;
    }
    
    const lines = value.split('\n');
    
    return lines.map((line, lineIndex) => {
      const tokens = tokenizeSql(line);
      const isErrorLine = errorLine === lineIndex + 1;
      
      return (
        <div 
          key={lineIndex} 
          className={cn(
            "min-h-[1.5rem]",
            isErrorLine && "bg-red-500/20 -mx-4 px-4"
          )}
        >
          {tokens.length === 0 ? (
            <span>&nbsp;</span>
          ) : (
            tokens.map((token, tokenIndex) => (
              <span
                key={tokenIndex}
                className={tokenColors[token.type] || tokenColors.default}
              >
                {token.text}
                {tokenIndex < tokens.length - 1 ? ' ' : ''}
              </span>
            ))
          )}
        </div>
      );
    });
  };
  
  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      
      onChange(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "border-2 border-yellow-500/30",
        "bg-gray-900"
      )}
      style={{ maxHeight, minHeight }}
    >
      {/* Line numbers */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-12",
          "bg-gray-800/50 border-r border-gray-700",
          "overflow-hidden select-none",
          "flex flex-col"
        )}
        style={{ minHeight }}
      >
        <div className="p-3 font-mono text-xs text-gray-500">
          {Array.from({ length: lineCount }, (_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-6 text-right pr-2",
                errorLine === i + 1 && "text-red-400 font-bold"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      
      {/* Highlighted code (background layer) */}
      <pre
        ref={highlightRef}
        className={cn(
          "absolute inset-0 ml-12 p-3",
          "font-mono text-sm leading-6",
          "overflow-auto pointer-events-none",
          "whitespace-pre-wrap break-words"
        )}
        style={{ maxHeight, minHeight }}
        aria-hidden="true"
      >
        <code>{renderHighlightedCode()}</code>
      </pre>
      
      {/* Actual textarea (input layer) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        className={cn(
          "relative w-full h-full ml-12 p-3",
          "font-mono text-sm leading-6",
          "bg-transparent text-transparent caret-white",
          "resize-none outline-none",
          "placeholder:text-gray-500"
        )}
        style={{ 
          maxHeight, 
          minHeight,
          width: 'calc(100% - 3rem)',
        }}
        placeholder={placeholder}
        dir="ltr"
      />
    </div>
  );
}

export default SqlEditor;
