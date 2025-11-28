document.addEventListener('DOMContentLoaded', () => {
    const dateKey = new Date().toLocaleDateString();

    chrome.storage.local.get(['daily_stats'], (result) => {
        const stats = result.daily_stats || {};

        // Check if stats are for today
        if (stats.date !== dateKey) {
            // If date doesn't match, it means no activity recorded for today yet
            updateUI('unknown', 0);
        } else {
            updateUI(stats.bonus_status, stats.visit_count);
        }
    });
});

function updateUI(bonusStatus, visitCount) {
    const bonusEl = document.getElementById('bonus-status');
    const countEl = document.getElementById('visit-count');

    let statusText = '未知';
    let statusClass = 'status-unknown';

    // Status values: 'claimed', 'unclaimed', 'maybe_claimed', 'unknown'
    if (bonusStatus === 'claimed') {
        statusText = '已领取';
        statusClass = 'status-claimed';
    } else if (bonusStatus === 'unclaimed') {
        statusText = '未领取';
        statusClass = 'status-unclaimed';
    } else if (bonusStatus === 'maybe_claimed') {
        statusText = '可能已领取';
        statusClass = 'status-claimed';
    }

    bonusEl.textContent = statusText;
    bonusEl.className = `value ${statusClass}`;

    countEl.textContent = visitCount || 0;
}
