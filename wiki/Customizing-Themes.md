# Customizing Themes in COGNIFLOW

COGNIFLOW offers a highly customizable UI to suit your personal preferences and professional environment.

## 🌓 Light and Dark Modes

You can toggle between Light and Dark modes using the switch in the sidebar.
- **Dark Mode**: A premium Red & Black aesthetic designed for high-focus development.
- **Light Mode**: A clean White & Red interface for better readability in bright environments.

## 🎨 Accent Color Picker

One of the most powerful features of COGNIFLOW is the ability to choose your own accent color. This color is used for buttons, highlights, scrollbars, and AI chat elements.

### How to Change Your Accent Color:
1. Open the **Settings** modal from the sidebar.
2. Scroll down to the **Accent Color** section.
3. Use the color picker to select your desired hue or enter a hex code (e.g., `#FF0000` for Red, `#3B82F6` for Blue).
4. Click **Save Settings**.

The application will immediately inject the new color into the global CSS variables, updating the entire UI without a page reload.

## 🛠 Technical Implementation

Themes are managed using CSS variables defined in `styles/globals.css`. The accent color is dynamically updated via the `App.tsx` component:

```typescript
useEffect(() => {
  if (settings.accentColor) {
    document.documentElement.style.setProperty('--user-accent-color', settings.accentColor);
  }
}, [settings.accentColor]);
```
