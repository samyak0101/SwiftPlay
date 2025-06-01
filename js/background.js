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
        
        // Store speed for this domain if available
        if (sender.tab && sender.tab.url) {
            try {
                const domain = new URL(sender.tab.url).hostname;
                storeDomainSpeed(domain, message.speed);
            } catch (e) {
                console.error('Error storing domain speed:', e);
            }
        }
    } else if (message.action === 'getDomainSpeed' && sender.tab) {
        try {
            const domain = new URL(sender.tab.url).hostname;
            getDomainSpeed(domain).then(speed => {
                sendResponse({ speed });
            });
            return true; // Keep the message channel open for the async response
        } catch (e) {
            console.error('Error getting domain speed:', e);
            sendResponse({ speed: null });
        }
    }
});

// Function to store speed for a domain
function storeDomainSpeed(domain, speed) {
    chrome.storage.sync.get('domainSpeeds', (result) => {
        const domainSpeeds = result.domainSpeeds || {};
        domainSpeeds[domain] = speed;
        chrome.storage.sync.set({ domainSpeeds });
    });
}

// Function to get stored speed for a domain
function getDomainSpeed(domain) {
    return new Promise((resolve) => {
        chrome.storage.sync.get('domainSpeeds', (result) => {
            const domainSpeeds = result.domainSpeeds || {};
            resolve(domainSpeeds[domain] || null);
        });
    });
}

// Listen for tab updates to set the badge for the current tab
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url) {
            try {
                const domain = new URL(tab.url).hostname;
                getDomainSpeed(domain).then(speed => {
                    if (speed !== null) {
                        const text = speed.toFixed(2);
                        chrome.action.setBadgeText({ text, tabId: tab.id });
                        chrome.action.setBadgeBackgroundColor({ color: '#228B22', tabId: tab.id });
                    } else {
                        chrome.action.setBadgeText({ text: '', tabId: tab.id });
                    }
                });
            } catch (e) {
                console.error('Error in tab activated handler:', e);
            }
        }
    });
});