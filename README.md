<div align="center">

<img src="public/images/logo.svg" alt="GitDB Logo" width="80" height="80" style="margin-bottom: 20px;">

# 🗄️ GitDB

**Local-First SQLite Manager, Synced with GitHub**

*A serverless database management tool using SQLite-WASM and OPFS*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

[中文说明](./README_zh.md) | [SQLite WASM](https://sqlite.org/wasm) | [Issues](https://github.com/shalom-lab/git-db/issues)

</div>

---

## ✨ Overview

**GitDB** is a lightweight, serverless database management tool that combines the power of **SQLite WASM** with the persistence of **GitHub**. It uses the browser's **Origin Private File System (OPFS)** for high-performance local operations and synchronizes your data with a GitHub repository.

### 🎯 Key Highlights

- 🚀 **Zero Setup** - No server, no backend, runs entirely in your browser
- 💾 **Local-First** - Works offline with instant local persistence
- ☁️ **Cloud Sync** - Version-controlled synchronization with GitHub
- 🔒 **Privacy First** - Your data stays in your browser and your private GitHub repo
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode support

---

## 🚀 Features

### 🛠️ Dynamic CRUD Operations
- **Auto-generated Forms** - Automatically creates forms based on your SQLite schema (`PRAGMA table_info`)
- **Smart Field Types** - Supports TEXT, INTEGER, BOOLEAN, DATE, DATETIME, TIMESTAMP, and more
- **Data Validation** - Built-in validation for required fields and data types
- **Inline Editing** - Edit records directly from the table view

### 💻 SQL Terminal
- **Syntax Highlighting** - Powered by Prism.js with SQL syntax support
- **Code Editor** - Professional code editor using `react-simple-code-editor`
- **Query Execution** - Execute complex SQL queries with real-time results
- **Performance Metrics** - See query execution time for optimization

### ☁️ Cloud Synchronization
- **One-Click Sync** - Push and pull your `.sqlite` file to GitHub with a single click
- **Version Control** - Track changes with Git SHA hashes
- **Conflict Detection** - Automatic detection of remote changes
- **Selective Sync** - Choose when to sync your data

### 🎨 User Experience
- **Bilingual Support** - Full English and Chinese interface
- **Dark Mode** - System-aware theme switching (Light/Dark/System)
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Keyboard Shortcuts** - Ctrl+Enter to execute SQL queries

---

## 📖 Getting Started

### 1️⃣ Deployment

To get your own private instance:

1. **Fork this repository** to your own GitHub account
2. Enable **GitHub Pages** in your repo settings:
   - Go to **Settings > Pages**
   - Under **Build and deployment > Source**, select **GitHub Actions**
3. Push any change to the **`main`** branch
4. The GitHub Action will automatically build and deploy your site
5. *(Optional)* Configure a custom domain in Pages settings

### 2️⃣ GitHub Configuration

For security, follow these recommendations:

| Step | Action | Details |
|------|--------|---------|
| 📂 **Create Private Repo** | Create a separate private repository | Name it something like `my-private-db` |
| 🔑 **Generate Token** | Create a Fine-grained Personal Access Token | Go to Settings > Developer settings > Personal access tokens > Fine-grained tokens |
| 🛡️ **Set Permissions** | Grant repository access | Select your private database repository |
| 📝 **Configure Access** | Set permissions to "Contents: Read and Write" | Only grant the minimum required permissions |
| 🔗 **Connect in GitDB** | Enter your token, repo, and path | Default path: `db/database.sqlite` |

### 3️⃣ First Use

1. Open your deployed GitDB instance
2. Navigate to **Settings** (⚙️ icon in sidebar)
3. Enter your GitHub configuration:
   - **Token**: Your Fine-grained Personal Access Token
   - **Repository**: `username/my-private-db`
   - **Path**: `db/database.sqlite` (or your custom path)
4. Click **Save** - GitDB will sync with your GitHub repository

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19 + TypeScript |
| **Database** | [@sqlite.org/sqlite-wasm](https://sqlite.org/wasm) |
| **Storage** | Origin Private File System (OPFS) |
| **API** | [Octokit](https://github.com/octokit/octokit.js) |
| **UI Framework** | Tailwind CSS |
| **Icons** | Lucide React |
| **Code Editor** | react-simple-code-editor + Prism.js |
| **Build Tool** | Vite |
| **Middleware** | [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) |

### 🎨 Branding

- **Logo**: Available in `public/images/logo.svg` (SVG format, blue theme `#387be5`)
- **Favicon**: Available in `public/images/favicon.svg` (32x32 optimized for browser tabs)
- **Usage**: The logo is used in README and can be customized by editing the SVG files

---

## 📋 Supported Data Types

GitDB automatically detects and provides appropriate input controls for:

| Type | Input Control | Format |
|------|---------------|--------|
| `TEXT`, `VARCHAR`, `CHAR` | Text input | Plain text |
| `INTEGER`, `NUMERIC` | Number input | Numeric values |
| `BOOLEAN` | Checkbox | `true`/`false` → `1`/`0` |
| `DATE` | Date picker | `YYYY-MM-DD` |
| `DATETIME`, `TIMESTAMP` | DateTime picker | `YYYY-MM-DD HH:MM:SS` |
| `REAL`, `FLOAT` | Number input | Decimal values |

---

## ⚠️ Security Notice

> **Important**: GitDB does not store your token on any server. The token is saved in your browser's `localStorage` only.

### Best Practices

- ✅ Use **Fine-grained Tokens** limited to a specific repository
- ✅ Create a **separate private repository** for your database files
- ✅ Grant only **"Contents: Read and Write"** permissions
- ✅ Treat your Access Token as a password
- ❌ Never commit tokens to your repository
- ❌ Don't share your token with others

---

## 🎯 Use Cases

- 📊 **Personal Data Management** - Track your personal projects, expenses, or habits
- 🧪 **Development Testing** - Quick database setup for local development
- 📝 **Content Management** - Manage structured content without a backend
- 🔬 **Data Analysis** - Store and query datasets locally
- 🎓 **Learning SQL** - Practice SQL queries in a safe, local environment

---

## 📝 Example Usage

### Creating a Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Inserting Data

Use the dynamic form or SQL terminal:

```sql
INSERT INTO users (name, email, is_active) 
VALUES ('John Doe', 'john@example.com', 1);
```

### Querying Data

```sql
SELECT * FROM users WHERE is_active = 1;
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [SQLite WASM](https://sqlite.org/wasm) - For the amazing WebAssembly SQLite implementation
- [Octokit](https://github.com/octokit/octokit.js) - For the GitHub API client
- [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) - For enabling SharedArrayBuffer support

---

<div align="center">

**Made with ❤️ using React, TypeScript, and SQLite**

[⭐ Star this repo](https://github.com/shalom-lab/git-db) if you find it helpful!

</div>
