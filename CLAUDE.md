# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebKeyBind is a Chrome Manifest V3 extension that allows users to bind custom keyboard shortcuts to web page elements (buttons, inputs, links, etc.) on different domains/URLs. The extension uses a plugin-style architecture designed for easy extensibility.

## Installation & Testing

Load the extension in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the project root directory

After code changes:
- Click the reload icon in `chrome://extensions/` for the extension
- Refresh any web pages if content script was modified

## Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Background Service Worker**: In `chrome://extensions/` → Click "service worker" → "Inspect"
- **Content Script**: Open DevTools (F12) on any webpage → Check Console for `[WebKeyBind]` logs

## Architecture

### Three-Context System

The extension operates across three Chrome contexts:

1. **Background (background/background.js)**: Service worker managing storage operations and cross-context messaging
2. **Content Script (content/content.js)**: Injected into all web pages, handles keydown events and element triggering
3. **Popup (popup/*)**: User interface for managing bindings, communicates with background and active tab

### Core Module Loading

The `core/` modules are loaded in **two separate contexts**:
- **Content Script**: Loaded via manifest.json content_scripts (for element selection and triggering)
- **Popup**: Loaded via `<script>` tags in popup.html (for element type detection during binding creation)

**Important**: `core/` modules use `window.*` for global exports to work in both contexts. They have no dependencies and use vanilla JavaScript.

### Handler Pattern (Extensibility)

The extension uses a handler-based architecture for supporting different element types:

```
core/types.js              → Defines ElementHandler interface + ElementType enum
core/handlers/*.js         → Concrete handlers (ButtonHandler, InputHandler, etc.)
core/HandlerRegistry.js    → Singleton registry managing all handlers
```

**ElementHandler interface** (must implement):
- `canHandle(element)`: Returns true if handler can process this element
- `trigger(element)`: Executes the element's action (e.g., click for buttons)
- `getSelector(element)`: Generates CSS selector + XPath + metadata for storage
- `findElement(selector)`: Locates element using stored selector info

### Adding New Element Types

To add support for a new element type (e.g., links):

1. Create `core/handlers/LinkHandler.js` extending `ElementHandler`
2. Implement all four required methods
3. Register in `core/HandlerRegistry.js`:
   ```javascript
   this.register(ElementType.LINK, new LinkHandler());
   ```
4. Add option in `popup/popup.html` element type dropdown
5. Update `core/types.js` if adding new ElementType constant

The content script will automatically use the new handler for matching elements.

### Data Flow

**Creating a binding**:
1. User clicks "Select Element" in popup → popup sends message to content script
2. Content script activates `ElementSelector` (visual picker with hover highlight)
3. User clicks element → `HandlerRegistry.detectHandler()` finds appropriate handler
4. Handler generates selector info → sent to popup via `chrome.storage.local`
5. User sets hotkey + saves → popup sends to background → stored in `chrome.storage.sync`

**Triggering a binding**:
1. Content script loads bindings from `chrome.storage.sync` on page load
2. Filters bindings matching current domain/URL
3. On keydown, matches key combination against active bindings
4. Finds element using `handler.findElement(selector)`
5. Calls `handler.trigger(element)` to execute action

### Element Selection Strategy

`ButtonHandler.js` demonstrates the selector generation logic:
- Primary: CSS selector (ID → classes → attributes → path)
- Fallback: XPath for robust element location
- Disambiguation: Element index + textContent matching for multiple matches

This dual-selector approach maximizes reliability across dynamic pages.

## Storage Structure

Configuration stored in `chrome.storage.sync` under key `bindings`:

```javascript
[{
  id: "binding_xxx",              // Unique ID
  domain: "example.com",          // Hostname
  url: "https://example.com/*",   // Optional URL pattern with wildcards
  elementType: "button",          // From ElementType enum
  selector: {
    selector: "#btn",             // CSS selector
    xpath: "//button[@id='btn']", // XPath fallback
    textContent: "Submit",        // For disambiguation
    index: 0                      // Position in querySelectorAll results
  },
  key: "Ctrl+S",                  // Normalized key string
  description: "Submit form",     // User-provided label
  ignoreInputFocus: false,        // If true, trigger even when focus is in text input
  enabled: true,
  createdAt: 1234567890
}]
```

## Key Technical Details

- **Manifest V3**: Uses service workers (background.js), not persistent background pages
- **No build step**: Pure vanilla JavaScript, loads directly in Chrome
- **Module pattern**: Files export to `window.*` for cross-context compatibility
- **Keydown handling**: Content script normalizes modifier keys (Ctrl+Alt+Shift+Meta + key) for matching
- **Input focus control**: Each binding can optionally ignore text input focus (via `ignoreInputFocus` flag). By default, shortcuts are blocked when focus is in text/password/email inputs or textareas, but work in radio/checkbox/button elements. Setting `ignoreInputFocus: true` allows the shortcut to trigger regardless of focus state.
- **Message passing**: Popup ↔ Background ↔ Content uses `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`

## Content Script Lifecycle

When a page loads:
1. `init()` runs, calls `loadBindings()` to fetch domain-specific configs
2. Registers global keydown listener
3. On keydown: builds key string → matches against bindings → triggers handler
4. Listens for `reloadBindings` message (sent when user saves/deletes bindings)

## Icon Management

Icons are pre-generated PNG files (16x16, 48x48, 128x128) in `icons/`. The source is `icons/icon.svg`. To regenerate:

```bash
cd icons
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

## Code Conventions

- JSDoc comments for public APIs
- Console logs prefixed with `[WebKeyBind]`
- CSS class names prefixed with `webkeybind-` to avoid conflicts
- Event listeners use `true` for capture phase when needed for priority handling
