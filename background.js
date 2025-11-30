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
    if (updates.activity_bar_class) stats.activity_bar_class = updates.activity_bar_class;
    if (updates.activity_bar_style) stats.activity_bar_style = updates.activity_bar_style;

    stats.last_updated = new Date().toLocaleString();

    await chrome.storage.local.set({ daily_stats: stats });
}

async function performCheckIn() {
    console.log(`Performing daily check-in at ${new Date().toLocaleString()}...`);

    // Check if already claimed today
    const dateKey = new Date().toLocaleDateString();
    const result = await chrome.storage.local.get(['daily_stats']);

    // Debug log to see current state
    console.log('Current daily_stats:', result.daily_stats);

    if (result.daily_stats && result.daily_stats.date === dateKey && result.daily_stats.bonus_status === 'claimed') {
        console.log('Daily bonus already claimed for today. Skipping check-in.');
        return;
    }

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
                        // Don't assume success immediately. Return 'attempted' so we check again later.
                        return 'attempted';
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
                const status = results[0].result;
                console.log('Check-in script result:', status);
                updateDailyStats({ bonus_status: status });
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
    console.log(`Performing periodic browsing at ${new Date().toLocaleString()}...`);

    // Check if already reached limit today
    const dateKey = new Date().toLocaleDateString();
    const result = await chrome.storage.local.get(['daily_stats']);
    if (result.daily_stats && result.daily_stats.date === dateKey) {
        const cls = result.daily_stats.activity_bar_class;
        if (cls && (cls.includes('member-activity-almost') || cls.includes('member-activity-done'))) {
            console.log(`Daily activity limit already reached (${cls}). Skipping browsing.`);
            return;
        }
    }

    try {
        const settings = await getSettings();
        const count = settings.topicCount;

        // 1. Fetch the recent page to get links and activity status
        const response = await fetch('https://www.v2ex.com/recent', {
            method: 'GET',
            cache: 'no-store', // Standard way to bypass cache
            headers: {
                'Referer': 'https://www.v2ex.com/',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();

        // Extract Activity Bar Info
        // Looking for: <div class="member-activity-bar"><div class="member-activity-almost" style="width: 100%;"></div></div>
        // We capture the class name (e.g., member-activity-almost) and the style (e.g., width: 100%;)
        const activityRegex = /class="member-activity-bar"\s*>\s*<div\s+class="([^"]+)"\s+style="([^"]+)"/i;
        const activityMatch = text.match(activityRegex);

        if (activityMatch) {
            const activityClass = activityMatch[1]; // e.g., member-activity-almost
            const activityStyle = activityMatch[2]; // e.g., width: 100%;

            console.log(`Activity Bar Found: Class=${activityClass}, Style=${activityStyle}`);

            await updateDailyStats({
                activity_bar_class: activityClass,
                activity_bar_style: activityStyle
            });

            // Check if we should stop browsing
            // Stop if Orange (member-activity-almost) or Black/Done (member-activity-done)
            if (activityClass.includes('member-activity-almost') || activityClass.includes('member-activity-done')) {
                console.log(`Activity level reached limit (${activityClass}). Stopping browsing for today.`);
                return;
            }
        } else {
            console.log('Activity bar not found in page source.');
        }

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
