
import React from 'react';
import { Database } from 'lucide-react';
import { Language, ViewType } from '../types';
import { I18N, ICONS } from '../constants';

interface SidebarProps {
  currentView: ViewType;
  currentTable: string | null;
  tables: any[];
  lang: Language;
  onViewChange: (view: ViewType) => void;
  onTableSelect: (name: string) => void;
  onSync: () => void;
  syncing: boolean;
  onRefresh: () => void;
  hasUnsavedChanges?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, currentTable, tables, lang, 
  onViewChange, onTableSelect, onSync, syncing, onRefresh,
  hasUnsavedChanges
}) => {
  const t = I18N[lang];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm z-20 h-screen overflow-hidden shrink-0 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2 text-primary font-bold">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.svg`}
            alt="GitDB Logo" 
            className="w-6 h-6"
          />
          <a 
            href="https://github.com/shalom-lab/git-db" 
            target="_blank" 
            rel="noreferrer"
            className="tracking-tight text-xl font-extrabold hover:underline transition-all"
          >
            GitDB
          </a>
        </div>
      </div>
      
      {/* View Navigation */}
      <div className="p-3 space-y-1">
        <p className="px-3 mb-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest">{t.nav.settings}</p>
        <button
          onClick={() => onViewChange('sql')}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center space-x-3 ${
            currentView === 'sql' 
              ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {React.cloneElement(ICONS.Terminal as React.ReactElement<any>, { size: 18 })}
          <span>{t.nav.sql}</span>
        </button>
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center space-x-3 ${
            currentView === 'settings' 
              ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {React.cloneElement(ICONS.Settings as React.ReactElement<any>, { size: 18 })}
          <span>{t.nav.settings}</span>
        </button>
      </div>

      {/* Tables List */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-gray-100 dark:border-gray-700 mt-2">
        <div className="px-6 py-4 flex items-center justify-between">
           <h3 className="text-[10px] uppercase font-black tracking-[0.15em] text-gray-400">{t.nav.tables}</h3>
           <button 
             onClick={onRefresh} 
             className="text-gray-400 hover:text-primary transition-all p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
             title={t.actions.refresh}
           >
              {ICONS.Refresh}
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 custom-scrollbar">
          {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl mx-2">
               <Database size={24} className="text-gray-200 mb-2" />
               <p className="text-[10px] text-gray-400 font-medium leading-tight">{t.empty.no_tables}</p>
            </div>
          ) : (
            tables.map(table => (
              <button
                key={table.name}
                onClick={() => onTableSelect(table.name)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] transition-all flex items-center space-x-3 group ${
                  currentView === 'tables' && currentTable === table.name 
                    ? 'bg-primary/10 text-primary font-bold border border-primary/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <div className={`transition-colors ${currentTable === table.name ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`}>
                  <Database size={14} />
                </div>
                <span className="truncate">{table.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="px-4 py-3 h-[52px] bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur border-t border-gray-200 dark:border-gray-700 relative shrink-0 flex items-center">
        {hasUnsavedChanges && (
          <div className="absolute top-0 right-6 -translate-y-1/2 flex items-center space-x-1.5 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded shadow-lg animate-bounce">
            {ICONS.Warning}
            <span>{t.nav.unsaved}</span>
          </div>
        )}
        <button 
          onClick={onSync}
          disabled={syncing}
          className="w-full bg-primary hover:bg-primary/90 text-white text-[13px] font-black py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.97]"
        >
          {ICONS.Save}
          <span className="tracking-wide uppercase">{t.nav.sync}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
