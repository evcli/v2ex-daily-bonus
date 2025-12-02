// Saves options to chrome.storage
const saveOptions = () => {
    const checkInOnStartup = document.getElementById('checkInOnStartup').checked;
    const checkInInterval = parseInt(document.getElementById('checkInInterval').value, 10);
    const browsingInterval = parseInt(document.getElementById('browsingInterval').value, 10);
    const topicCount = parseInt(document.getElementById('topicCount').value, 10);
    const maxVisitCount = parseInt(document.getElementById('maxVisitCount').value, 10);

    chrome.storage.sync.set(
        {
            checkInOnStartup,
            checkInInterval,
            browsingInterval,
            topicCount,
            maxVisitCount
        },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 750);

            // Notify background script to update alarms
            chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
        }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        {
            checkInOnStartup: false,
            checkInInterval: 3,
            browsingInterval: 60,
            topicCount: 8,
            maxVisitCount: 80
        },
        (items) => {
            document.getElementById('checkInOnStartup').checked = items.checkInOnStartup;
            document.getElementById('checkInInterval').value = items.checkInInterval;
            document.getElementById('browsingInterval').value = items.browsingInterval;
            document.getElementById('topicCount').value = items.topicCount;
            document.getElementById('maxVisitCount').value = items.maxVisitCount;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
