document.addEventListener('DOMContentLoaded', () => {
    // Use UTC date to match background script logic
    const dateKey = new Date().toISOString().slice(0, 10);

    chrome.storage.local.get(['daily_stats'], (result) => {
        const stats = result.daily_stats || {};

        // Check if stats are for today (UTC)
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

    // Update Last Updated Times
    const localTimeEl = document.getElementById('local-time');
    const utcTimeEl = document.getElementById('utc-time');
    const lastUpdatedEl = document.getElementById('last-updated');

    if (stats.last_updated) {
        const date = new Date(stats.last_updated);

        // Format: YYYY/MM/DD HH:mm:ss
        const localStr = date.toLocaleString('zh-CN', { hour12: false });
        // Format: HH:mm:ss
        const utcStr = date.toISOString().slice(11, 19);

        if (localTimeEl) localTimeEl.textContent = localStr;
        if (utcTimeEl) utcTimeEl.textContent = utcStr;

        // Clear the old single-line display as we have the detailed one now
        if (lastUpdatedEl) lastUpdatedEl.textContent = '';
    } else {
        if (localTimeEl) localTimeEl.textContent = '--';
        if (utcTimeEl) utcTimeEl.textContent = '--';
        if (lastUpdatedEl) lastUpdatedEl.textContent = '等待数据更新...';
    }
}
