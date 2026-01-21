
import React from 'react';
import { 
  Database, GitBranch, Github, Settings, Plus, Save, Download, 
  RefreshCcw, Search, Trash2, Edit, Terminal, FileCode, 
  CheckCircle2, XCircle, Rocket, Sun, Moon, Monitor, AlertTriangle, Star
} from 'lucide-react';

export const APP_NAME = "GitDB";
export const DEFAULT_DB_PATH = "db/database.sqlite";

export const I18N = {
  en: {
    auth: {
      title: "Welcome to GitDB",
      subtitle: "Local-First SQLite, Synced with GitHub",
      token_label: "GitHub Personal Access Token",
      token_hint: "Needs 'repo' scope (Fine-grained or Classic)",
      repo_label: "Repository Path (owner/repo)",
      repo_placeholder: "e.g., yourname/my-database",
      path_label: "Database File Path",
      path_placeholder: "e.g., db/data.sqlite",
      save_btn: "Connect & Launch",
    },
    nav: {
      tables: "Tables",
      settings: "Settings",
      sql: "SQL Terminal",
      sync: "Sync Cloud",
      browser: "Browser",
      unsaved: "Unsaved changes"
    },
    status: {
      checking: "Checking remote version...",
      downloading: "Syncing from GitHub...",
      ready: "Local Mode Ready",
      saving: "Pushing to GitHub...",
      error: "Sync Failed",
      unconfigured: "Unconfigured",
      dirty: "Changes not synced"
    },
    actions: {
      new_record: "Add Record",
      save_cloud: "Push to GitHub",
      refresh: "Refresh Data",
      delete: "Delete",
      edit: "Edit",
      confirm: "Confirm",
      cancel: "Cancel",
      run_sql: "Run Query",
      get_started: "Get Started"
    },
    settings: {
      title: "Settings",
      connection: "Connection Settings",
      danger_zone: "Danger Zone",
      reset_desc: "This will clear your credentials and reload the app.",
      path_desc: "The path to your .sqlite file inside the repository.",
      save_btn: "Save Configuration",
      reset_btn: "Reset Application Data"
    },
    empty: {
      no_tables: "No tables found in database.",
      no_rows: "This table is currently empty.",
      sql_help: "Supports comments (-- comment). Enter SQL and press Run.",
      welcome_title: "Ready to Sync?",
      welcome_desc: "Connect your GitHub repository to enable persistent cloud storage and multi-device sync.",
      explorer_title: "Explorer GitDB",
      explorer_desc: "Select a table or use SQL terminal."
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System"
    },
    warnings: {
      unsaved_exit: "You have unsaved changes. Sync to GitHub before leaving to prevent data loss."
    }
  },
  zh: {
    auth: {
      title: "欢迎使用 GitDB",
      subtitle: "本地优先，云端同步 —— 您的 Serverless 数据库管家",
      token_label: "GitHub 访问令牌 (Token)",
      token_hint: "需要 'repo' 权限的 Personal Access Token",
      repo_label: "仓库路径 (owner/repo)",
      repo_placeholder: "例如：username/my-git-db",
      path_label: "数据库文件路径",
      path_placeholder: "例如：db/database.sqlite",
      save_btn: "保存凭据并启动",
    },
    nav: {
      tables: "数据表",
      settings: "配置中心",
      sql: "SQL 终端",
      sync: "同步云端",
      browser: "数据浏览",
      unsaved: "有改动未同步"
    },
    status: {
      checking: "正在检查版本...",
      downloading: "发现新版本，同步中...",
      ready: "就绪 (本地模式)",
      saving: "正在推送至 GitHub...",
      error: "同步失败",
      unconfigured: "未配置",
      dirty: "数据有变动"
    },
    actions: {
      new_record: "新建数据",
      save_cloud: "推送到 GitHub",
      refresh: "刷新数据",
      delete: "删除",
      edit: "编辑",
      confirm: "确定",
      cancel: "取消",
      run_sql: "执行查询",
      get_started: "立即配置"
    },
    settings: {
      title: "配置中心",
      connection: "连接配置",
      danger_zone: "危险区域",
      reset_desc: "清除所有本地凭据并重新加载应用。",
      path_desc: "仓库中 .sqlite 数据库文件的完整路径。",
      save_btn: "保存配置",
      reset_btn: "重置应用数据"
    },
    empty: {
      no_tables: "数据库中暂无数据表",
      no_rows: "当前表没有数据",
      sql_help: "支持注释 (-- 注释)。输入 SQL，点击执行或按 Ctrl+Enter",
      welcome_title: "开启云端同步",
      welcome_desc: "连接 GitHub 仓库，开启持久化云端存储与多端同步功能。",
      explorer_title: "探索 GitDB",
      explorer_desc: "选择一个数据表或使用 SQL 终端。"
    },
    theme: {
      light: "浅色",
      dark: "深色",
      system: "系统"
    },
    warnings: {
      unsaved_exit: "您有尚未同步到云端的本地改动。离开前请先同步，以防数据丢失。"
    }
  }
};

export const ICONS = {
  Database: <Database size={16} />,
  Branch: <GitBranch size={18} />,
  Github: <Github size={18} />,
  Settings: <Settings size={16} />,
  Plus: <Plus size={16} />,
  Save: <Save size={16} />,
  Download: <Download size={16} />,
  Refresh: <RefreshCcw size={14} />,
  Search: <Search size={16} />,
  Trash: <Trash2 size={16} />,
  Edit: <Edit size={16} />,
  Terminal: <Terminal size={16} />,
  Code: <FileCode size={16} />,
  Check: <CheckCircle2 size={16} />,
  Error: <XCircle size={16} />,
  Rocket: <Rocket size={24} />,
  Sun: <Sun size={14} />,
  Moon: <Moon size={14} />,
  Monitor: <Monitor size={14} />,
  Warning: <AlertTriangle size={14} />,
  Star: <Star size={16} />
};
