<div align="center">

<img src="public/images/logo.svg" alt="GitDB Logo" width="80" height="80" style="margin-bottom: 20px;">

# 🗄️ GitDB

**本地优先，云端同步 —— 您的 Serverless 数据库管家**

*基于 SQLite-WASM 和 OPFS 的无服务器数据库管理工具*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

[English Version](./README.md) | [SQLite WASM](https://sqlite.org/wasm) | [Issues](https://github.com/shalom-lab/git-db/issues)

</div>

---

## ✨ 项目简介

**GitDB** 是一款轻量级的 Serverless 数据库管理工具。它巧妙地结合了 **SQLite WASM** 的本地高性能与 **GitHub** 的云端存储能力。利用浏览器的 **OPFS (源私有文件系统)** 实现秒级本地响应，并通过 GitHub API 确保您的数据在多端同步。

### 🎯 核心亮点

- 🚀 **零配置** - 无需服务器，无需后端，完全在浏览器中运行
- 💾 **本地优先** - 离线可用，本地持久化存储，响应迅速
- ☁️ **云端同步** - 与 GitHub 进行版本控制的同步
- 🔒 **隐私至上** - 数据仅存在于您的浏览器和私有 GitHub 仓库
- 🎨 **现代界面** - 美观、响应式设计，支持暗色模式

---

## 🚀 功能特性

### 🛠️ 动态 CRUD 操作
- **自动生成表单** - 根据 SQLite 结构自动创建表单 (`PRAGMA table_info`)
- **智能字段类型** - 支持 TEXT、INTEGER、BOOLEAN、DATE、DATETIME、TIMESTAMP 等多种类型
- **数据验证** - 内置必填字段和数据类型验证
- **行内编辑** - 直接在表格视图中编辑记录

### 💻 SQL 终端
- **语法高亮** - 基于 Prism.js 的 SQL 语法高亮
- **代码编辑器** - 使用 `react-simple-code-editor` 的专业代码编辑器
- **查询执行** - 执行复杂 SQL 查询并实时显示结果
- **性能指标** - 查看查询执行时间，便于优化

### ☁️ 云端同步
- **一键同步** - 一键推送/拉取 `.sqlite` 文件到 GitHub
- **版本控制** - 使用 Git SHA 哈希跟踪更改
- **冲突检测** - 自动检测远程更改
- **选择性同步** - 自由选择同步时机

### 🎨 用户体验
- **双语支持** - 完整的中英文界面
- **暗色模式** - 系统感知的主题切换（浅色/深色/跟随系统）
- **响应式设计** - 在桌面和移动设备上无缝工作
- **键盘快捷键** - Ctrl+Enter 执行 SQL 查询

---

## 📖 使用指南

### 1️⃣ 部署说明

要拥有您私人的 GitDB 实例：

1. **Fork 本仓库** 到您的个人 GitHub 账号
2. 在仓库设置中开启 **GitHub Pages**：
   - 前往 **Settings > Pages**
   - 在 **Build and deployment > Source** 下，选择 **GitHub Actions**
3. 向 **`main`** 分支提交代码
4. GitHub Action 将自动构建并部署您的站点
5. *(可选)* 在 Pages 设置中配置自定义域名

### 2️⃣ GitHub 权限配置

为了确保安全，请遵循以下建议：

| 步骤 | 操作 | 详情 |
|------|------|------|
| 📂 **创建私有仓库** | 创建独立的私有仓库 | 命名为类似 `my-private-db` |
| 🔑 **生成令牌** | 创建细粒度个人访问令牌 | 前往 Settings > Developer settings > Personal access tokens > Fine-grained tokens |
| 🛡️ **设置权限** | 授予仓库访问权限 | 选择您的私有数据库仓库 |
| 📝 **配置访问** | 设置权限为 "Contents: Read and Write" | 仅授予最小必需权限 |
| 🔗 **在 GitDB 中连接** | 输入您的令牌、仓库和路径 | 默认路径：`db/database.sqlite` |

### 3️⃣ 首次使用

1. 打开您部署的 GitDB 实例
2. 导航到 **设置**（侧边栏中的 ⚙️ 图标）
3. 输入您的 GitHub 配置：
   - **令牌**：您的细粒度个人访问令牌
   - **仓库**：`username/my-private-db`
   - **路径**：`db/database.sqlite`（或您的自定义路径）
4. 点击 **保存** - GitDB 将与您的 GitHub 仓库同步

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript |
| **数据库** | [@sqlite.org/sqlite-wasm](https://sqlite.org/wasm) |
| **存储** | Origin Private File System (OPFS) |
| **API** | [Octokit](https://github.com/octokit/octokit.js) |
| **UI 框架** | Tailwind CSS |
| **图标** | Lucide React |
| **代码编辑器** | react-simple-code-editor + Prism.js |
| **构建工具** | Vite |
| **中间件** | [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) |


## 📋 支持的数据类型

GitDB 会自动检测并提供相应的输入控件：

| 类型 | 输入控件 | 格式 |
|------|----------|------|
| `TEXT`, `VARCHAR`, `CHAR` | 文本输入框 | 纯文本 |
| `INTEGER`, `NUMERIC` | 数字输入框 | 数值 |
| `BOOLEAN` | 复选框 | `true`/`false` → `1`/`0` |
| `DATE` | 日期选择器 | `YYYY-MM-DD` |
| `DATETIME`, `TIMESTAMP` | 日期时间选择器 | `YYYY-MM-DD HH:MM:SS` |
| `REAL`, `FLOAT` | 数字输入框 | 小数值 |

---

## ⚠️ 安全提醒

> **重要**：GitDB 不会在任何服务器存储您的令牌。所有凭据仅保存在您浏览器的 `localStorage` 中。

### 最佳实践

- ✅ 使用限制到特定仓库的**细粒度令牌**
- ✅ 为数据库文件创建**独立的私有仓库**
- ✅ 仅授予 **"Contents: Read and Write"** 权限
- ✅ 像对待密码一样保护您的访问令牌
- ❌ 永远不要将令牌提交到仓库
- ❌ 不要与他人分享您的令牌

---

## 🎯 使用场景

- 📊 **个人数据管理** - 跟踪个人项目、支出或习惯
- 🧪 **开发测试** - 本地开发的快速数据库设置
- 📝 **内容管理** - 无需后端管理结构化内容
- 🔬 **数据分析** - 本地存储和查询数据集
- 🎓 **学习 SQL** - 在安全的本地环境中练习 SQL 查询

---

## 📝 使用示例

### 创建表

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 插入数据

使用动态表单或 SQL 终端：

```sql
INSERT INTO users (name, email, is_active) 
VALUES ('张三', 'zhangsan@example.com', 1);
```

### 查询数据

```sql
SELECT * FROM users WHERE is_active = 1;
```

---

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [SQLite WASM](https://sqlite.org/wasm) - 出色的 WebAssembly SQLite 实现
- [Octokit](https://github.com/octokit/octokit.js) - GitHub API 客户端
- [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) - 启用 SharedArrayBuffer 支持

---

<div align="center">

**使用 React、TypeScript 和 SQLite 精心制作 ❤️**

如果觉得有用，请 [⭐ 给这个仓库点个星](https://github.com/shalom-lab/git-db)！

</div>
