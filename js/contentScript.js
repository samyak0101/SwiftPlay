(function() {
    'use strict';

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

    // Function to update the badge
    function updateBadge(speed) {
        chrome.runtime.sendMessage({ action: 'updateBadge', speed: speed });
    }

    // Function to set video speed
    function setSpeed(speed) {
        try {
            if (typeof speed !== 'number' || isNaN(speed)) {
                console.error('Invalid speed value:', speed);
                return;
            }

            const videos = document.getElementsByTagName('video');
            let speedSet = false;
            
            for (let video of videos) {
                try {
                    if (video && typeof video.playbackRate !== 'undefined') {
                        // Ensure speed is within valid range
                        const validSpeed = Math.max(0.1, Math.min(16, speed));
                        video.playbackRate = validSpeed;
                        speedSet = true;
                        updateBadge(validSpeed);
                    }
                } catch (videoError) {
                    console.error('Error setting speed for video element:', videoError);
                }
            }
            
            if (speedSet) {
                console.log(`Video speed set to ${speed}x`);
            } else {
                console.log('No video elements found to set speed');
            }
        } catch (error) {
            console.error('Error in setSpeed:', error);
        }
    }

    // Function to handle keyboard shortcuts
    function handleKeyPress(e) {
        try {
            // Only handle if not in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const videos = document.getElementsByTagName('video');
            if (videos.length === 0) return;

            const currentSpeed = videos[0].playbackRate;
            let newSpeed = currentSpeed;
            const key = e.key.toLowerCase();

            if (key === shortcuts.slowDownKey) {
                newSpeed = Math.max(0.1, currentSpeed - shortcuts.slowDownAmount);
            } else if (key === shortcuts.speedUpKey) {
                newSpeed = Math.min(16, currentSpeed + shortcuts.speedUpAmount);
            } else if (key === shortcuts.resetKey) {
                newSpeed = 1.0;
            } else if (key === shortcuts.maxKey) {
                newSpeed = shortcuts.maxAmount;
            } else {
                return;
            }

            // Round to 1 decimal place to avoid floating point issues
            newSpeed = Math.round(newSpeed * 10) / 10;
            setSpeed(newSpeed);
        } catch (error) {
            console.error('Error in handleKeyPress:', error);
        }
    }

    // Function to check for videos and set initial speed
    function checkForVideosAndInitialize() {
        const videos = document.getElementsByTagName('video');
        if (videos.length > 0) {
            // Report current speed instead of setting it
            if (videos[0].playbackRate !== 1.0) {
                updateBadge(videos[0].playbackRate);
            }
        }

        // Set up mutation observer to watch for videos
        setupVideoDetection();
    }

    // Set up mutation observer to detect when videos are added to the page
    function setupVideoDetection() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const videos = document.getElementsByTagName('video');
                    if (videos.length > 0) {
                        updateBadge(videos[0].playbackRate);
                        break;
                    }
                }
            }
        });

        // Make sure document.body exists before observing
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // If body doesn't exist yet, wait for it
            const bodyCheckInterval = setInterval(() => {
                if (document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    clearInterval(bodyCheckInterval);
                }
            }, 50);

            // Clear interval after 10 seconds to avoid infinite checking
            setTimeout(() => clearInterval(bodyCheckInterval), 10000);
        }
    }

    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // Listen for messages from background script and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            if (request.action === 'ping') {
                // Used to check if content script is loaded
                sendResponse({ status: 'ok' });
            } else if (request.action === 'setShortcuts') {
                shortcuts = request.shortcuts;
                sendResponse({ success: true });
            } else if (request.action === 'setSpeed') {
                if (typeof request.speed === 'number' && !isNaN(request.speed)) {
                    setSpeed(request.speed);
                    sendResponse({ success: true });
                } else {
                    console.error('Invalid speed value received:', request.speed);
                    sendResponse({ success: false, error: 'Invalid speed value' });
                }
            } else if (request.action === 'getCurrentSpeed') {
                const videos = document.getElementsByTagName('video');
                if (videos.length > 0) {
                    sendResponse({ speed: videos[0].playbackRate });
                } else {
                    sendResponse({ speed: 1.0 });
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep the message channel open for async response
    });

    // Initialize
    checkForVideosAndInitialize();

    // Log that the content script has loaded
    console.log('SwiftPlay Video Speed Controller content script loaded');
})();