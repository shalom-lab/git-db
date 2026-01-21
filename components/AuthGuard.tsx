
import React, { useState } from 'react';
import { GithubConfig, Language } from '../types';
import { I18N, ICONS, DEFAULT_DB_PATH, DEFAULT_BRANCH } from '../constants';

interface AuthGuardProps {
  onSave: (config: GithubConfig) => void;
  lang: Language;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ onSave, lang }) => {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('');
  const [path, setPath] = useState(DEFAULT_DB_PATH);
  const t = I18N[lang].auth;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim() && repo.trim()) {
      onSave({
        token: token.trim(),
        repo: repo.trim(),
        branch: DEFAULT_BRANCH,
        path: path.trim() || DEFAULT_DB_PATH
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-dark p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 my-auto">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full text-primary border border-primary/20 shadow-inner">
              <div className="flex items-center space-x-2">
                {ICONS.Branch}
                <span className="text-2xl font-bold tracking-tighter">GitDB</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-center mb-1 text-gray-900 dark:text-gray-100">{t.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8 text-xs font-medium">
            {t.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">{t.token_label}</label>
              <input
                type="password"
                required
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="mt-1 text-[10px] text-gray-400">{t.token_hint}</p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">{t.repo_label}</label>
              <input
                type="text"
                required
                placeholder={t.repo_placeholder}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">{t.path_label}</label>
              <input
                type="text"
                placeholder={t.path_placeholder}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] mt-4"
            >
              <span>{t.save_btn}</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <a 
              href="https://github.com/settings/tokens/new" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              How to get a GitHub Token?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGuard;
