// V2EX Daily Bonus Background Script

const ALARM_CHECKIN = 'daily_checkin';
const ALARM_BROWSING = 'periodic_browse';

// Default settings
const DEFAULT_SETTINGS = {
    checkInOnStartup: false,
    checkInInterval: 3,
    browsingInterval: 60,
    topicCount: 8
};

// Initialize alarms on install or startup
chrome.runtime.onInstalled.addListener(setupAlarms);
chrome.runtime.onStartup.addListener(handleStartup);

// Listen for settings updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_UPDATED') {
        setupAlarms();
    }
});

async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
            resolve(items);
        });
    });
}

async function handleStartup() {
    const settings = await getSettings();
    if (settings.checkInOnStartup) {
        console.log('Startup check-in enabled. Performing check-in...');
        performCheckIn();
    }
}

async function setupAlarms() {
    const settings = await getSettings();
    console.log('Setting up alarms with settings:', settings);

    // Clear existing alarms to reset intervals
    await chrome.alarms.clearAll();

    // Schedule daily check-in
    chrome.alarms.create(ALARM_CHECKIN, {
        periodInMinutes: settings.checkInInterval * 60
    });

    // Schedule periodic browsing
    chrome.alarms.create(ALARM_BROWSING, {
        periodInMinutes: settings.browsingInterval
    });
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_CHECKIN) {
        performCheckIn();
    } else if (alarm.name === ALARM_BROWSING) {
        performBrowsing();
    }
});

async function updateDailyStats(updates) {
    const dateKey = new Date().toLocaleDateString();
    const result = await chrome.storage.local.get(['daily_stats']);
    let stats = result.daily_stats || { date: dateKey, bonus_status: 'unknown', visit_count: 0 };

    // Reset if new day
    if (stats.date !== dateKey) {
        stats = { date: dateKey, bonus_status: 'unknown', visit_count: 0 };
    }

    // Apply updates
    if (updates.bonus_status) stats.bonus_status = updates.bonus_status;
    if (updates.increment_visit) stats.visit_count = (stats.visit_count || 0) + 1;

    await chrome.storage.local.set({ daily_stats: stats });
}

async function performCheckIn() {
    console.log('Performing daily check-in...');
    try {
        // 1. Open the mission daily page
        const tab = await createTab('https://www.v2ex.com/mission/daily');

        // 2. Wait a bit for page load
        setTimeout(async () => {
            // 3. Execute script to find and click the button
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const button = document.querySelector('input[type="button"][value^="领取"]');
                    if (button) {
                        button.click();
                        console.log('Check-in button clicked.');
                        return 'claimed';
                    } else {
                        // Check for text indicating already claimed
                        if (document.body.innerText.includes('每日登录奖励已领取')) {
                            return 'claimed';
                        }
                        console.log('Check-in button not found (maybe already collected).');
                        return 'maybe_claimed';
                    }
                }
            });

            if (results && results[0] && results[0].result) {
                updateDailyStats({ bonus_status: results[0].result });
            }

            // 4. Close tab after a delay
            setTimeout(() => {
                chrome.tabs.remove(tab.id);
            }, 5000);
        }, 5000);
    } catch (err) {
        console.error('Error performing check-in:', err);
    }
}

async function performBrowsing() {
    console.log('Performing periodic browsing...');
    try {
        const settings = await getSettings();
        const count = settings.topicCount;

        // 1. Fetch the recent page to get links
        const response = await fetch('https://www.v2ex.com/recent', {
            headers: {
                'Referer': 'https://www.v2ex.com/',
                'Cache-Control': 'no-cache'
            }
        });
        const text = await response.text();

        // Regex to find topic links in href attributes. 
        // Matches href="/t/123456" or href="/t/123456#reply1"
        const topicRegex = /href="\/t\/(\d+)(?:#\w+)?"/g;
        const matches = [...text.matchAll(topicRegex)];

        // Get unique topic IDs to avoid duplicates
        // match[1] contains the ID
        const uniqueTopicIds = [...new Set(matches.map(m => m[1]))];
        const topIds = uniqueTopicIds.slice(0, count);

        console.log(`Found topics to browse (limit ${count}):`, topIds);

        // 2. Open each topic
        for (const id of topIds) {
            const url = `https://www.v2ex.com/t/${id}`;
            console.log(`Visiting URL: ${url}`);
            try {
                const tab = await createTab(url);

                // Stay on the page for a random time between 5-10 seconds
                const stayTime = 5000 + Math.random() * 5000;

                await new Promise(resolve => setTimeout(resolve, stayTime));

                chrome.tabs.remove(tab.id);
                console.log(`Successfully visited and closed: ${url}`);
                updateDailyStats({ increment_visit: true });
            } catch (innerErr) {
                console.error(`Failed to visit URL: ${url}`, innerErr);
            }
        }
    } catch (err) {
        console.error('Error performing browsing:', err);
        if (err.message) {
            console.error(`Connection failed: ${err.message}`);
        }
    }
}

function createTab(url) {
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.create({ url, active: false }, (tab) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(tab);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}
