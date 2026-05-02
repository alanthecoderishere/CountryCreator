# 🗺️ GeoSandbox Editor - Country Creator

A premium, web-based Geopolitical Sandbox tool for creating and managing custom country borders. Designed for roleplayers, world-builders, and map enthusiasts.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## ✨ Features

- **Interactive Border Drawing**: Click to place vertices and right-click to finalize your country.
- **Dynamic Rank System**: Choose from various government types (Monarchy, Republic, Theocratic, International).
- **Persistent Storage**: Your maps are automatically saved to your browser's local storage.
- **Data Portability**: Export your world data to JSON and import it back anytime.
- **Discord Integration**: Sends live notifications to your server via Webhooks when a new country is created or defeated.
- **Modern UI**: Dark mode aesthetics with glassmorphism effects.

## 🚀 How to Play

1. **Draw**: Use Left-Click to place points on the map.
2. **Finalize**: Right-Click once you have at least 3 points to name your country and choose its rank.
3. **Manage**: Use the sidebar to track active countries or delete them.
4. **Backup**: Use the **Export JSON** button to save your progress as a file.

## 🛠️ Setup for Developers

If you want to run this locally:
1. Clone the repository:
   ```bash
   git clone https://github.com/alanthecoderishere/CountryCreator.git
   ```
2. Open `index.html` in your browser OR use a local server:
   ```bash
   python3 -m http.server 8080
   ```

## 📝 Configuration

To connect your own Discord server:
1. Open `app.js`.
2. Replace the `webhookUrl` variable on line 4 with your own Discord Webhook URL.

---
*Created with ❤️ by Alan (alanthecoderishere)*
