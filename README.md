# V2EX Daily Bonus

A Chrome extension that helps you get daily login bonus and stay active on V2EX automatically.

## Features

- ✅ **Auto Check-in**: Visit V2EX mission page and click the daily bonus button automatically
- 🔄 **Auto Browse**: Open recent topics to keep your account active
- ⚙️ **Easy Settings**: Change check-in time, browse time, and topic count
- 🚀 **Start on Launch**: Check-in when you open Chrome (optional)

## How to Install

### Install from Source (Developer Mode)

1. Download or clone this project to your computer
2. Open Chrome and go to `chrome://extensions/`
3. Turn on "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the project folder

### Install from Chrome Web Store

> Coming soon...

## How to Use

### First Time Setup

1. Make sure you are logged in to V2EX in Chrome
2. Install the extension - it will start working automatically
3. Right-click the extension icon and select "Options" to change settings

### Settings

#### Daily Check-in
- **Check-in on browser startup**: Check-in once when you open Chrome
- **Check-in interval (hours)**: How often to check-in (default: 12 hours)

#### Activity / Browsing
- **Browsing interval (minutes)**: How often to browse topics (default: 60 minutes)
- **Topics to view per run**: How many topics to open each time (default: 8)

### View Logs

1. Go to `chrome://extensions/`
2. Find "V2EX Daily Bonus"
3. Click "Service Worker"
4. See logs in the console

## How It Works

- **Manifest V3**: Uses the latest Chrome extension API
- **Service Worker**: Runs in background, no need to keep page open
- **Chrome Alarms API**: Creates scheduled tasks
- **Chrome Storage API**: Saves your settings


## Permissions

This extension needs these permissions:

- `alarms`: Create scheduled tasks
- `tabs`: Open and close tabs
- `scripting`: Click buttons on pages
- `storage`: Save your settings
- `host_permissions: https://www.v2ex.com/*`: Only access V2EX website

## Privacy

- This extension only visits V2EX website (`https://www.v2ex.com/*`)
- Does not collect, store, or send any user data
- All settings are saved in your browser only
- Open source - you can check the code

## FAQ

**Q: Why does check-in fail?**  
A: Make sure you are logged in to V2EX in Chrome. The extension uses your browser cookies.

**Q: Can I set a fixed time for check-in?**  
A: Not yet. It uses time intervals now.

**Q: Will V2EX think I am a bot?**  
A: The extension acts like a real user (opens pages, clicks buttons). It also waits 5-10 seconds randomly when browsing topics.

**Q: Does it work when Chrome is closed?**  
A: No. Chrome extensions need the browser to be open. Keep Chrome running or turn on "Check-in on browser startup".

## Development

### Local Development

```bash
# Clone the project
git clone https://github.com/evcli/v2ex_daily_bonus.git
cd v2ex_daily_bonus

# Load in Chrome (developer mode)
# After making changes, click refresh button in chrome://extensions/
```

### Debug

- View Service Worker logs: Click "Service Worker" on extension card
- Test tasks manually: Run in Service Worker console:
  ```javascript
  chrome.alarms.create('daily_checkin', { when: Date.now() + 1000 });
  chrome.alarms.create('periodic_browse', { when: Date.now() + 1000 });
  ```

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License

## Author

Evan

## Thanks

Thanks to V2EX community for the great platform.

