# Manual Modification Guide

This guide explains how to perform common tasks in the codebase manually.

## 🟢 Task: Adding a New Page (e.g., "Music Generation")

### Step 1: Create the Page Module
1.  Create `src/renderer/pages/music/music.js`.
2.  Add a load function:
    ```javascript
    function loadMusicPage(container) {
        container.innerHTML = `
            <div class="studio-layout">
                <div class="studio-controls glass-panel">
                    <h2>Music Controls</h2>
                    <!-- Inputs go here -->
                </div>
                <div class="studio-viewport">
                    <!-- Results go here -->
                </div>
            </div>
        `;
    }
    ```

### Step 2: Register in `index.html`
Open `src/renderer/index.html` and add the script reference:
```html
<script src="pages/music/music.js"></script>
```

### Step 3: Register in Router (`app.js`)
Open `src/renderer/app.js`, find `showPage(page)`:
```javascript
switch (page) {
    // ... existing cases
    case 'music':
        loadMusicPage(mainContent);
        break;
}
```

### Step 4: Add to Sidebar (`sidebar.js`)
Open `src/renderer/components/sidebar/sidebar.js` and add to `navItems`:
```javascript
{ id: 'music', icon: '...', label: 'Music' }
```

---

## 🔵 Task: Changing the AI Model Endpoint

1.  Open `src/renderer/utils/web-api.js` (or currently Mock Logic in page files).
2.  Locate the `generateVideo` or `cloneVoice` function.
3.  Modify the payload or URL:
    ```javascript
    // Example: Changing video model
    const response = await fetch('http://localhost:3000/api/generate-video', {
        method: 'POST',
        body: JSON.stringify({
            model: 'new-model-v2', // <--- Change this
            prompt: ...
        })
    });
    ```

---

## 🟣 Task: Customizing Colors

1.  Open `src/renderer/styles.css`.
2.  Scroll to `:root`.
3.  Change `--gradient-magic` to your preferred colors:
    ```css
    --gradient-magic: linear-gradient(135deg, #ff0000 0%, #ff8800 100%); /* Fire Theme */
    ```
