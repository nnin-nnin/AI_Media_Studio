# Architecture Overview

This document explains the high-level structure and logic of the AI Media Studio.

## 1. Core Philosophy
The application follows a **Vanilla JavaScript SPA (Single Page Application)** architecture. It does not use React, Vue, or Angular. Instead, it uses modern ES Modules and native DOM manipulation for maximum performance and simplicity.

## 2. Directory Structure
```
src/
├── renderer/             # Frontend Logic (The "View")
│   ├── index.html        # The only HTML file in the core app.
│   ├── app.js            # Main Router & Initializer.
│   ├── styles.css        # Global Variables & Base Styles.
│   ├── studio-layout.css # The 3-Column Layout Grid.
│   │
│   ├── components/       # Reusable UI Blocks
│   │   ├── sidebar/      # The Global Nav Sidebar.
│   │   └── toast.js      # Notification system.
│   │
│   └── pages/            # Page-Specific Logic
│       ├── home/         # Mission Control (Landing Page).
│       ├── face-swap/    # Face Swap Tool.
│       ├── video-generation/
│       └── voice-cloning/
│
└── server/               # Backend Logic (The "Brain")
    └── server.js         # Node.js Express Server handling API calls.
```

## 3. The "Studio Layout" System
All tool pages (Face, Video, Voice) share a unified 3-Column Layout defined in `studio-layout.css`.

| Section | Width/Flex | Purpose |
| :--- | :--- | :--- |
| **Sidebar** | `256px` (Fixed) | Global Navigation (`<studio-sidebar>`). |
| **Controls** | `28%` (Flex) | User Inputs (Prompts, Sliders, Uploads). |
| **Viewport** | `Flex: 1` | The "Canvas" or Result Preview area. |

## 4. Application Flow (`app.js`)
1.  **Boot**: `index.html` loads modules.
2.  **Init**: `app.js` -> `initializeApp()` sets up routing.
3.  **Render**: `sidebar.js` renders the navigation into `#app`.
4.  **Route**: When user clicks a link:
    *   `window.app.navigate('page-name')` is called.
    *   `showPage()` clears `#main-content`.
    *   The specific page module (e.g., `loadVideoGenerationPage`) injects its HTML.

## 5. Components
*   **Sidebar**: A custom Web Component-like structure that manages active states.
*   **Toast**: Simple notification popups for success/error messages.
