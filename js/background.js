// Default shortcuts configuration
let shortcuts = {
    slowDownKey: 'a',
    slowDownAmount: 0.1,
    speedUpKey: 's',
    speedUpAmount: 0.1,
    resetKey: ',',
    maxKey: '.',
    maxAmount: 10.0
};

// Load shortcuts from storage
chrome.storage.sync.get('shortcuts', (result) => {
    if (result.shortcuts) {
        shortcuts = result.shortcuts;
        console.log('Loaded custom shortcuts:', shortcuts);
    } else {
        // If no saved shortcuts, use defaults and save them
        chrome.storage.sync.set({ shortcuts });
    }
});

// Track the current speed for each tab
const tabSpeeds = new Map();

// Function to get current tab
async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

// Badge update handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateBadge' && typeof message.speed === 'number') {
        const text = message.speed.toFixed(2);
        const tabId = sender.tab?.id;
        
        if (tabId) {
            // Store the speed for this tab
            tabSpeeds.set(tabId, message.speed);
            
            // Update badge
            chrome.action.setBadgeText({ text, tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#228B22', tabId }); // green
        }
    } else if (message.action === 'getShortcuts') {
        sendResponse(shortcuts);
    }
    return true; // Keep the message channel open for async response
});

// Inject content script when the user clicks the extension icon
chrome.action.onClicked.addListener(async (tab) => {
    await injectContentScript(tab.id);
});

// When popup is opened
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'popupOpened') {
        const tab = await getCurrentTab();
        if (tab) {
            await injectContentScript(tab.id);
            sendResponse({ success: true });
        }
    }
    return true; // Keep the message channel open for async response
});

// Inject the content script and apply speed changes
async function injectContentScript(tabId) {
    try {
        // Check if the content script is already injected
        try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            console.log('Content script already injected');
        } catch (error) {
            // Content script isn't injected yet, inject it
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['js/contentScript.js']
            });
            console.log('Content script injected');
        }
        
        // Send the shortcuts to the content script
        chrome.tabs.sendMessage(tabId, { 
            action: 'setShortcuts', 
            shortcuts 
        });
        
        // Restore saved speed for this tab if it exists
        if (tabSpeeds.has(tabId)) {
            const speed = tabSpeeds.get(tabId);
            chrome.tabs.sendMessage(tabId, { 
                action: 'setSpeed', 
                speed 
            });
        }
    } catch (error) {
        console.error('Error injecting content script:', error);
    }
}

// Listen for tab updates to update the badge
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tabId = activeInfo.tabId;
    if (tabSpeeds.has(tabId)) {
        const speed = tabSpeeds.get(tabId);
        const text = speed.toFixed(2);
        chrome.action.setBadgeText({ text, tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#228B22', tabId });
    } else {
        // Clear badge if no speed is set for this tab
        chrome.action.setBadgeText({ text: '', tabId });
    }
});

// Handle keyboard command shortcuts
chrome.commands.onCommand.addListener(async (command) => {
    const tab = await getCurrentTab();
    if (!tab) return;
    
    // Ensure content script is injected
    await injectContentScript(tab.id);
    
    // Get current speed or use default
    let currentSpeed = tabSpeeds.has(tab.id) ? tabSpeeds.get(tab.id) : 1.0;
    let newSpeed = currentSpeed;
    
    // Apply speed change based on command
    switch (command) {
        case 'slow-down':
            newSpeed = Math.max(0.1, currentSpeed - shortcuts.slowDownAmount);
            break;
        case 'speed-up':
            newSpeed = Math.min(16, currentSpeed + shortcuts.speedUpAmount);
            break;
        case 'reset-speed':
            newSpeed = 1.0;
            break;
        case 'max-speed':
            newSpeed = shortcuts.maxAmount;
            break;
    }
    
    // Round to 1 decimal place to avoid floating point issues
    newSpeed = Math.round(newSpeed * 10) / 10;
    
    // Send the speed update to the content script
    chrome.tabs.sendMessage(tab.id, { 
        action: 'setSpeed', 
        speed: newSpeed 
    });
    
    // Update the stored speed
    tabSpeeds.set(tab.id, newSpeed);
    
    // Update badge
    const text = newSpeed.toFixed(2);
    chrome.action.setBadgeText({ text, tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#228B22', tabId: tab.id });
});