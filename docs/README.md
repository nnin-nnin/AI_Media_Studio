# AI Media Studio - Project Documentation

Welcome to the AI Media Studio project! This application is a professional-grade, local desktop tool for AI media generation (Face Swap, Video, Voice).

## 📚 Documentation Index

1.  **[Installation & Setup Guide (安装与运行指南)](./installation.md)**
    *   Windows (Desktop Setup / Portable / WebUI / PowerShell).
    *   macOS (DMG / Apple Silicon & Intel / Gatekeeper "已损坏" 一键修复).
    *   Linux & Headless Server deployment.
    *   API Key configuration & FAQ.

2.  **[Architecture & Structure](./architecture.md)**
    *   Understand how the code is organized.
    *   Learn about the Frontend/Backend split (`renderer` vs `server`).
    *   Understand the "Studio Layout" system.

3.  **[Design System](./design-system.md)**
    *   Visual guide to "Glassmorphism".
    *   Colors, Typography, and Component usage (Buttons, Cards, Inputs).
    *   CSS Variable reference.

4.  **[Manual Modification Guide](./manual-modification.md)**
    *   **How-To**: Add a new Sidebar Item.
    *   **How-To**: creating a New Page.
    *   **How-To**: Modify AI Generation Logic.

## 🚀 Quick Start

### 1. Prerequisites
*   Node.js (LTS v20 or higher recommended)
*   npm

### 2. Installation
```bash
npm install
```

### 3. Running the App
```bash
npm start
```
This starts two processes:
*   **Backend Server**: `http://localhost:3000`
*   **Electron Window**: Loads the frontend from `src/renderer`.

## 🛠 Project Structure Overview
```
/src
  ├── /renderer         # Frontend (HTML/CSS/JS)
  │     ├── /components # Reusable UI pieces (Sidebar, Toast)
  │     ├── /pages      # Feature Pages (Face Swap, Video, etc.)
  │     ├── app.js      # Main Entry Point & Router
  │     └── styles.css  # Global Styles
  └── /server           # Backend (Node.js/Express)
        └── index.js    # API Endpoints
```
