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
    } else {
        // Reset to default if not present
        activityBarInner.className = 'member-activity-start';
        activityBarInner.style.width = '0%';
    }

    if (stats.activity_bar_style) {
        activityBarInner.style = stats.activity_bar_style;
    }

    // Update Last Updated
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = stats.last_updated ? `更新于: ${stats.last_updated}` : '等待数据更新...';
    }
}
