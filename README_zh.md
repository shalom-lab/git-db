# 🗄️ GitDB

**本地优先，云端同步 —— 您的 Serverless 数据库管家。**  
**基于 SQLite-WASM 和 OPFS 的无服务器数据库管理工具。**

[English Version](./README.md) | [开源协议: MIT](https://opensource.org/licenses/MIT) | [SQLite WASM](https://sqlite.org/wasm)

---

## 🌟 项目简介

**GitDB** 是一款轻量级的 Serverless 数据库管理工具。它巧妙地结合了 **SQLite WASM** 的本地高性能与 **GitHub** 的云端存储能力。利用浏览器的 **OPFS (源私有文件系统)** 实现秒级本地响应，并通过 GitHub API 确保您的数据在多端同步。

## 🚀 功能特性

- 🛠️ **动态 CRUD**: 基于 SQLite 结构自动生成数据录入表单 (`PRAGMA table_info`)。
- 💻 **SQL 终端**: 专业的 SQL 控制台，支持代码高亮并直接在浏览器执行复杂查询。
- ☁️ **云端同步**: 带有版本校验的同步逻辑。一键上传/下载 `.sqlite` 数据库文件至 GitHub。
- 🔒 **隐私至上**: 数据仅存在于您的浏览器和您的私有 GitHub 仓库中，无需中间服务器。
- 🌍 **国际化**: 完善的中英文界面支持。
- ⚡ **本地优先**: 离线可用，通过本地持久化存储，随时同步至云端。

## 📖 使用指南

### 1. 部署说明
要拥有您私人的 GitDB 实例：

1. **Fork 本仓库** 到您的个人 GitHub 账号。
2. 在仓库设置中开启 **GitHub Pages** (**Settings > Pages**)。
3. 在 **Build and deployment > Source** 下，选择 **GitHub Actions**。
4. 向 **`main`** 分支提交代码，GitHub Action 将自动完成部署。
5. (可选) 支持绑定自定义域名。

### 2. GitHub 权限配置
为了确保安全，请遵循以下建议：

- 📂 **私有仓库**: 建议创建一个**独立的私有仓库**专门用于存放数据库文件（例如：`my-private-db`）。
- 🔑 **细粒度令牌**: 推荐使用 GitHub 的 **Fine-grained Token**（细粒度个人访问令牌）。
- 🛡️ **权限范围**: 仅为该私有仓库开启 **"Contents: Read and Write"** (内容读写) 权限。
- 📑 **数据库路径**: 默认存储路径为 `db/database.sqlite`，您可以在配置中心自由修改。

## 🛠️ 技术栈

- **核心**: React 19 + TypeScript
- **数据库**: [@sqlite.org/sqlite-wasm](https://sqlite.org/wasm)
- **接口**: [Octokit](https://github.com/octokit/octokit.js) (GitHub 官方 SDK)
- **UI**: Tailwind CSS + Lucide Icons
- **中间件**: [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) (为 OPFS 开启 SharedArrayBuffer 支持)

## ⚠️ 安全提醒

**GitDB** 不会在任何服务器存储您的 Token。所有凭据仅保存在您浏览器的 `localStorage` 中。尽管如此，请务必像对待密码一样保护您的 Access Token。**务必使用限制了仓库访问范围的细粒度令牌**以将风险降至最低。

---

## 📄 开源协议

MIT License. 欢迎自由使用与修改。
