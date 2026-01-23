
import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism.css';
import { executeQuery } from '../services/sqliteService';
import { Language } from '../types';
import { I18N, ICONS } from '../constants';

interface SqlTerminalProps {
  lang: Language;
  onMutation?: () => void;
}

const SqlTerminal: React.FC<SqlTerminalProps> = ({ lang, onMutation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const t = I18N[lang];

  const highlightCode = (code: string) => {
    return highlight(code, languages.sql, 'sql');
  };

  const handleRun = async () => {
    if (!query.trim()) return;
    setError(null);
    setResults([]);
    const start = performance.now();
    try {
      const data = await executeQuery(query);
      setResults(data);
      setExecTime(performance.now() - start);

      const normalizedQuery = query.trim().toUpperCase();
      const isMutation = /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/.test(normalizedQuery);
      if (isMutation) onMutation?.();
    } catch (err: any) {
      setError(err.message);
      setResults([]);
      setExecTime(null);
    }
  };


  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden relative min-h-[240px]">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 z-30">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center space-x-2">
              {ICONS.Terminal}
              <span>Console</span>
            </span>
            <span className="text-[9px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">SQL Syntax ON</span>
          </div>
          <button
            onClick={handleRun}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-5 py-1.5 rounded-lg text-xs font-black transition-all shadow-md shadow-primary/10 active:scale-95 uppercase tracking-widest"
          >
            {ICONS.Code}
            <span>{t.actions.run_sql}</span>
          </button>
        </div>
        
        {/* SQL Editor Container */}
        <div className="relative flex-1 w-full group overflow-hidden bg-white dark:bg-gray-800">
          <Editor
            value={query}
            onValueChange={setQuery}
            highlight={highlightCode}
            padding={24}
            placeholder="-- Write your SQL here...&#10;CREATE TABLE demo (id INTEGER PRIMARY KEY);"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleRun();
              }
              if (e.key === 'Tab') {
                e.preventDefault();
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart || 0;
                const end = target.selectionEnd || 0;
                const newValue = query.substring(0, start) + '  ' + query.substring(end);
                setQuery(newValue);
                setTimeout(() => {
                  target.selectionStart = target.selectionEnd = start + 2;
                }, 0);
              }
            }}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              fontSize: 14,
              lineHeight: 1.7,
              outline: 'none',
              border: 'none',
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              color: 'inherit',
              overflow: 'auto',
            }}
            textareaClassName="mono text-[14px] leading-[1.7] outline-none resize-none whitespace-pre-wrap break-all custom-scrollbar transition-colors focus:ring-0 caret-gray-900 dark:caret-white"
            preClassName="mono text-[14px] leading-[1.7] whitespace-pre-wrap break-all custom-scrollbar"
          />
          <style>{`
            /* Prism.js 暗色模式样式覆盖 */
            .dark pre code,
            .dark code[class*="language-"],
            .dark pre[class*="language-"] {
              color: #e2e8f0;
            }
            .dark .token.comment,
            .dark .token.prolog,
            .dark .token.doctype,
            .dark .token.cdata {
              color: #94a3b8;
            }
            .dark .token.punctuation {
              color: #cbd5e1;
            }
            .dark .token.property,
            .dark .token.tag,
            .dark .token.boolean,
            .dark .token.number,
            .dark .token.constant,
            .dark .token.symbol,
            .dark .token.deleted {
              color: #fbbf24;
            }
            .dark .token.selector,
            .dark .token.attr-name,
            .dark .token.string,
            .dark .token.char,
            .dark .token.builtin,
            .dark .token.inserted {
              color: #10b981;
            }
            .dark .token.operator,
            .dark .token.entity,
            .dark .token.url,
            .dark .language-css .token.string,
            .dark .style .token.string {
              color: #60a5fa;
            }
            .dark .token.atrule,
            .dark .token.attr-value,
            .dark .token.keyword {
              color: #60a5fa;
            }
            .dark .token.function,
            .dark .token.class-name {
              color: #a78bfa;
            }
            .dark .token.regex,
            .dark .token.important,
            .dark .token.variable {
              color: #f59e0b;
            }
          `}</style>
          <div className="absolute bottom-3 right-5 text-[8px] text-gray-300 dark:text-gray-600 font-black uppercase tracking-widest pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            Ctrl + Enter to execute
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top-2 z-10">
          <span className="text-red-500 mt-0.5">{ICONS.Error}</span>
          <div className="space-y-1">
            <p className="text-[13px] text-red-700 dark:text-red-400 font-mono font-bold leading-tight">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
           <div className="flex items-center space-x-3">
             <div className="flex items-center space-x-1.5">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{results.length} Results</span>
             </div>
             {execTime && <span className="text-[11px] font-bold text-gray-300 dark:text-gray-600 mono px-2 py-0.5 bg-gray-50 dark:bg-gray-700 rounded-full">{execTime.toFixed(2)}ms</span>}
           </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          {results.length > 0 ? (
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {Object.keys(results[0]).map(key => (
                    <th key={key} className="px-6 py-3 font-black text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/80 backdrop-blur-md uppercase tracking-tighter text-[11px]">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-6 py-3 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap group-hover:text-gray-900 dark:group-hover:text-gray-100 border-r border-gray-50 dark:border-gray-700 last:border-0">
                        {val === null ? <span className="italic opacity-30 text-gray-300">null</span> : val.toString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-200 dark:text-gray-700 p-12 space-y-4">
               <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700">
                  {React.cloneElement(ICONS.Terminal as React.ReactElement<any>, { size: 64, strokeWidth: 1 })}
               </div>
               <div className="text-center space-y-1">
                 <p className="text-[13px] font-black uppercase tracking-[0.3em]">{t.empty.sql_help}</p>
                 <p className="text-[12px] opacity-60">Result set will appear here after execution</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SqlTerminal;
