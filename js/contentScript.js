(function() {
    'use strict';

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

            switch(e.key.toLowerCase()) {
                case 'a':
                    newSpeed = Math.max(0.1, currentSpeed - 0.1);
                    break;
                case 's':
                    newSpeed = Math.min(16, currentSpeed + 0.1);
                    break;
                case ',':
                    newSpeed = 1.0;
                    break;
                case '.':
                    newSpeed = 10.0;
                    break;
                default:
                    return;
            }

            // Round to 1 decimal place to avoid floating point issues
            newSpeed = Math.round(newSpeed * 10) / 10;
            setSpeed(newSpeed);
        } catch (error) {
            console.error('Error in handleKeyPress:', error);
        }
    }

    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            if (request.action === 'setSpeed') {
                if (typeof request.speed === 'number' && !isNaN(request.speed)) {
                    setSpeed(request.speed);
                    sendResponse({ success: true });
                } else {
                    console.error('Invalid speed value received:', request.speed);
                    sendResponse({ success: false, error: 'Invalid speed value' });
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep the message channel open for async response
    });

    // Set initial speed to 1.0
    setSpeed(1.0);

    // Log that the content script has loaded
    console.log('Super Video Speed Controller content script loaded');
})();