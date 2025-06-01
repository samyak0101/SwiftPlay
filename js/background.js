chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateBadge' && typeof message.speed === 'number') {
        const text = message.speed.toFixed(2);
        if (sender.tab && sender.tab.id) {
            chrome.action.setBadgeText({ text, tabId: sender.tab.id });
            chrome.action.setBadgeBackgroundColor({ color: '#228B22', tabId: sender.tab.id }); // green
        } else {
            // fallback: set for all tabs if sender.tab is not available
            chrome.action.setBadgeText({ text });
            chrome.action.setBadgeBackgroundColor({ color: '#228B22' });
        }
    }
});

// Listen for tab updates to set the badge for the current tab
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url) {
            try {
                // Just ensure badge is visible when switching tabs
                chrome.action.setBadgeBackgroundColor({ color: '#228B22', tabId: tab.id });
            } catch (e) {
                console.error('Error in tab activated handler:', e);
            }
        }
    });
});