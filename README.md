# 🗄️ GitDB

**Local-First SQLite Manager, Synced with GitHub.**  
**A serverless database management tool using SQLite-WASM and OPFS.**

[中文说明](./README_zh.md) | [License: MIT](https://opensource.org/licenses/MIT) | [SQLite WASM](https://sqlite.org/wasm)

---

## 🌟 Overview

**GitDB** is a lightweight, serverless database management tool that combines the power of **SQLite WASM** with the persistence of **GitHub**. It uses the browser's **Origin Private File System (OPFS)** for high-performance local operations and synchronizes your data with a GitHub repository.

## 🚀 Features

- 🛠️ **Dynamic CRUD**: Automatically generates forms based on your SQLite schema (`PRAGMA table_info`).
- 💻 **SQL Terminal**: A professional SQL console with syntax highlighting for executing complex queries.
- ☁️ **Cloud Sync**: Version-controlled synchronization. Push and pull your `.sqlite` file to GitHub with one click.
- 🔒 **Privacy First**: Your data stays in your browser and your private GitHub repo. No middleman servers.
- 🌍 **Bilingual Support**: Full English and Chinese interface support.
- ⚡ **Local-First**: Works offline using local persistence and syncs when you're ready.

## 📖 Getting Started

### 1. Deployment
To get your own private instance:

1. **Fork this repository** to your own GitHub account.
2. Enable **GitHub Pages** in your repo settings (**Settings > Pages**).
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Push any change to the **`main`** branch, and the Action will automatically deploy your site.
5. (Optional) Configure a custom domain.

### 2. GitHub Configuration
For security, please follow these recommendations:

- 📂 **Private Repo**: Create a **separate private repository** specifically for your database files (e.g., `my-private-db`).
- 🔑 **Fine-grained Token**: Use a **GitHub Fine-grained Personal Access Token**.
- 🛡️ **Permissions**: Grant **"Contents: Read and Write"** access ONLY to your private database repository.
- 📑 **Database Path**: Default path is `db/database.sqlite`. You can customize this in settings.

## 🛠️ Tech Stack

- **Core**: React 19 + TypeScript
- **Database**: [@sqlite.org/sqlite-wasm](https://sqlite.org/wasm)
- **API**: [Octokit](https://github.com/octokit/octokit.js) (GitHub SDK)
- **UI**: Tailwind CSS + Lucide Icons
- **Middleware**: [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) (Enables SharedArrayBuffer for OPFS)

## ⚠️ Security Notice

**GitDB** does not store your token on any server. The token is saved in your browser's `localStorage` only. However, always treat your Access Token as a password. Use a **Fine-grained Token** limited to a specific repo to minimize risk.

---

## 📄 License

MIT License. Feel free to use and modify.
