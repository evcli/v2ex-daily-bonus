document.addEventListener('DOMContentLoaded', () => {
    const dateKey = new Date().toLocaleDateString();

    chrome.storage.local.get(['daily_stats'], (result) => {
        const stats = result.daily_stats || {};

        // Check if stats are for today
        if (stats.date !== dateKey) {
            // If date doesn't match, it means no activity recorded for today yet
            updateUI({ bonus_status: 'unknown', visit_count: 0 });
        } else {
            updateUI(stats);
        }
    });
});

function updateUI(stats) {
    const bonusEl = document.getElementById('bonus-status');
    const countEl = document.getElementById('visit-count');

    let statusText = '未知';
    let statusClass = 'status-unknown';

    // Status values: 'claimed', 'unclaimed', 'maybe_claimed', 'unknown'
    if (stats.bonus_status === 'claimed') {
        statusText = '已领取';
        statusClass = 'status-claimed';
    } else if (stats.bonus_status === 'unclaimed') {
        statusText = '未领取';
        statusClass = 'status-unclaimed';
    } else if (stats.bonus_status === 'maybe_claimed') {
        statusText = '可能已领取';
        statusClass = 'status-claimed';
    }

    bonusEl.textContent = statusText;
    bonusEl.className = `value ${statusClass}`;

    countEl.textContent = stats.visit_count || 0;

    // Update Activity Bar
    const activityBarInner = document.getElementById('activity-bar-inner');
    if (stats.activity_bar_class) {
        activityBarInner.className = stats.activity_bar_class;
    }
    if (stats.activity_bar_style) {
        // Ensure we only apply safe styles or just the width if needed, 
        // but user asked to copy the style which usually contains width.
        activityBarInner.style = stats.activity_bar_style;
    }
}
