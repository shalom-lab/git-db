
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { GithubConfig, Language } from '../types';
import { I18N, ICONS, DEFAULT_DB_PATH } from '../constants';
import { GitHubService, ValidationResult } from '../services/githubService';

interface SettingsViewProps {
  config: GithubConfig | null;
  lang: Language;
  onUpdate: (config: GithubConfig) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ config, lang, onUpdate }) => {
  const [localConfig, setLocalConfig] = useState<GithubConfig>(config || {
    token: '',
    repo: '',
    path: DEFAULT_DB_PATH
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const t = I18N[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localConfig.token.trim() || !localConfig.repo.trim()) {
      return;
    }

    // 开始验证
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await GitHubService.validateConfig({
        token: localConfig.token.trim(),
        repo: localConfig.repo.trim(),
        path: localConfig.path.trim() || DEFAULT_DB_PATH
      });

      // 根据语言本地化错误消息
      if (!result.valid && lang === Language.ZH) {
        const zhMessages: { [key: string]: string } = {
          'Invalid token. Please check your GitHub token.': 'Token 无效，请检查您的 GitHub token。',
          'Invalid repository format. Expected: owner/repo': '仓库格式无效，应为：owner/repo',
          'not found or you don\'t have access to it.': '未找到或您没有访问权限。',
          'Access denied to repository': '访问仓库被拒绝',
          'Token does not have "Contents: Read" permission': 'Token 没有 "Contents: Read" 权限',
          'Token does not have "Contents: Write" permission': 'Token 没有 "Contents: Write" 权限',
          'Validation failed unexpectedly': '验证意外失败',
          'Configuration validated successfully!': '配置验证成功！'
        };
        
        // 尝试匹配并替换消息
        for (const [en, zh] of Object.entries(zhMessages)) {
          if (result.message.includes(en) || result.message === en) {
            result.message = result.message.replace(en, zh);
            break;
          }
        }
        
        // 特殊处理包含仓库名的消息
        if (result.message.includes('Repository "') && result.message.includes('" not found')) {
          const repoMatch = result.message.match(/Repository "([^"]+)"/);
          if (repoMatch) {
            result.message = `仓库 "${repoMatch[1]}" 未找到或您没有访问权限。`;
          }
        } else if (result.message.includes('Access denied to repository "')) {
          const repoMatch = result.message.match(/repository "([^"]+)"/);
          if (repoMatch) {
            result.message = `访问仓库 "${repoMatch[1]}" 被拒绝，请检查您的 token 权限。`;
          }
        } else if (result.message.includes('Token does not have "Contents: Read" permission for repository "')) {
          const repoMatch = result.message.match(/repository "([^"]+)"/);
          if (repoMatch) {
            result.message = `Token 对仓库 "${repoMatch[1]}" 没有 "Contents: Read" 权限。`;
          }
        } else if (result.message.includes('Token does not have "Contents: Write" permission for repository "')) {
          const repoMatch = result.message.match(/repository "([^"]+)"/);
          if (repoMatch) {
            result.message = `Token 对仓库 "${repoMatch[1]}" 没有 "Contents: Write" 权限。请授予 "Contents: Read and Write" 权限。`;
          }
        }
      }

      setValidationResult(result);

      if (result.valid) {
        // 验证通过，保存配置
        onUpdate({
          ...localConfig,
          token: localConfig.token.trim(),
          repo: localConfig.repo.trim(),
          path: localConfig.path.trim() || DEFAULT_DB_PATH
        });
      }
    } catch (error: any) {
      const errorMsg = lang === Language.ZH 
        ? '验证意外失败，请检查网络连接和配置。'
        : error.message || 'Validation failed unexpectedly';
      
      setValidationResult({
        valid: false,
        message: errorMsg,
        details: {
          tokenValid: false,
          repoAccessible: false,
          hasReadPermission: false,
          hasWritePermission: false
        }
      });
    } finally {
      setIsValidating(false);
    }
  };

  const REPO_URL = "https://github.com/shalom-lab/git-db"; // Updated to match likely repo name

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 relative z-10">
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

          {/* 验证结果提示 */}
          {validationResult && (
            <div className={`p-4 rounded-xl border ${
              validationResult.valid 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-3">
                <span className={validationResult.valid ? 'text-green-500' : 'text-red-500'}>
                  {validationResult.valid ? ICONS.Check : ICONS.Error}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${
                    validationResult.valid 
                      ? 'text-green-700 dark:text-green-400' 
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {validationResult.message}
                  </p>
                  {validationResult.details && !validationResult.valid && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {!validationResult.details.tokenValid && (
                        <p>• {lang === Language.EN ? 'Token is invalid or expired' : 'Token 无效或已过期'}</p>
                      )}
                      {validationResult.details.tokenValid && !validationResult.details.repoAccessible && (
                        <p>• {lang === Language.EN ? 'Repository not found or inaccessible' : '仓库未找到或无法访问'}</p>
                      )}
                      {validationResult.details.repoAccessible && !validationResult.details.hasReadPermission && (
                        <p>• {lang === Language.EN ? 'Missing "Contents: Read" permission' : '缺少 "Contents: Read" 权限'}</p>
                      )}
                      {validationResult.details.hasReadPermission && !validationResult.details.hasWritePermission && (
                        <p>• {lang === Language.EN ? 'Missing "Contents: Write" permission' : '缺少 "Contents: Write" 权限'}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
              disabled={isValidating}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 flex items-center space-x-2"
            >
              {isValidating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>{lang === Language.EN ? 'Validating...' : '验证中...'}</span>
                </>
              ) : (
                <span>{t.settings.save_btn}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="pt-4 px-2">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-4"></div>
          
          <div className="flex items-center space-x-2 text-primary">
            <img 
              src={`${import.meta.env.BASE_URL}images/logo.svg`}
              alt="GitDB Logo" 
              className="w-5 h-5"
            />
            <a 
              href="https://github.com/shalom-lab/git-db" 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-black tracking-widest uppercase hover:underline transition-all"
            >
              GitDB Open Source
            </a>
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
              className="group flex items-center space-x-2 border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-6 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:shadow-amber-900/20 active:scale-95"
            >
              <Star className="w-4 h-4 fill-amber-400 dark:fill-amber-500 text-amber-400 dark:text-amber-500 group-hover:fill-amber-500 dark:group-hover:fill-amber-400 transition-all group-hover:scale-110" />
              <span>{lang === Language.EN ? "Give a Star" : "给个 Star"}</span>
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
