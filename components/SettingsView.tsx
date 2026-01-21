
import React, { useState } from 'react';
import { GithubConfig, Language } from '../types';
import { I18N, ICONS, DEFAULT_DB_PATH, DEFAULT_BRANCH } from '../constants';

interface SettingsViewProps {
  config: GithubConfig | null;
  lang: Language;
  onUpdate: (config: GithubConfig) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ config, lang, onUpdate }) => {
  const [localConfig, setLocalConfig] = useState<GithubConfig>(config || {
    token: '',
    repo: '',
    path: DEFAULT_DB_PATH,
    branch: DEFAULT_BRANCH
  });
  const t = I18N[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localConfig.token.trim() && localConfig.repo.trim()) {
      onUpdate({
        ...localConfig,
        token: localConfig.token.trim(),
        repo: localConfig.repo.trim(),
        path: localConfig.path.trim() || DEFAULT_DB_PATH
      });
    }
  };

  const REPO_URL = "https://github.com/shalom-lab/gitdb"; // Updated to match likely repo name

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            {ICONS.Settings}
            <span>{t.settings.connection}</span>
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* GitHub Token First */}
          <div className="space-y-1.5 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <label className="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center space-x-2 uppercase tracking-tighter">
              {ICONS.Github}
              <span>{t.auth.token_label}</span>
            </label>
            <input
              type="password"
              required
              placeholder="github_pat_xxxxxxxxxxxx"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              value={localConfig.token}
              onChange={(e) => setLocalConfig({ ...localConfig, token: e.target.value })}
            />
            <p className="text-[10px] text-gray-400 font-medium">{t.auth.token_hint}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">{t.auth.repo_label}</label>
              <input
                type="text"
                required
                placeholder={t.auth.repo_placeholder}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={localConfig.repo}
                onChange={(e) => setLocalConfig({ ...localConfig, repo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">{t.auth.path_label}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={localConfig.path}
                onChange={(e) => setLocalConfig({ ...localConfig, path: e.target.value })}
              />
              <p className="text-[10px] text-gray-400">{t.settings.path_desc}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700">
            <a 
              href="https://github.com/settings/personal-access-tokens/new" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center space-x-1"
            >
              <span>{lang === Language.EN ? 'Get Fine-grained Token' : '获取细粒度令牌 (Fine-grained)'}</span>
            </a>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
            >
              {t.settings.save_btn}
            </button>
          </div>
        </form>
      </div>

      <div className="pt-4 px-2">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-4"></div>
          
          <div className="flex items-center space-x-2 text-primary">
            {ICONS.Branch}
            <span className="text-sm font-black tracking-widest uppercase">GitDB Open Source</span>
          </div>
          
          <p className="text-[12px] text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
            {lang === Language.EN 
              ? "GitDB is an open-source tool for building modern, serverless data workflows. If you find it useful, please support us with a star!" 
              : "GitDB 是一款致力于构建现代化 Serverless 数据工作流的开源工具。如果您觉得好用，请为我们点个 Star 吧！"}
          </p>

          <div className="flex items-center space-x-4">
            <a 
              href={REPO_URL} 
              target="_blank" 
              rel="noreferrer"
              className="group flex items-center space-x-2 bg-gray-900 dark:bg-gray-700 text-white px-6 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all hover:bg-black dark:hover:bg-gray-600 hover:shadow-lg active:scale-95"
            >
              {ICONS.Github}
              <span>GitHub Repo</span>
            </a>
            <a 
              href={REPO_URL + "/stargazers"} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-6 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all hover:border-primary hover:text-primary active:scale-95 shadow-sm"
            >
              {lang === Language.EN ? "Give a Star" : "给个 Star"}
            </a>
          </div>

          <div className="text-[10px] font-mono text-gray-400 dark:text-gray-600 uppercase tracking-widest pt-2">
            shalom-lab / gitdb
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
